# frozen_string_literal: true

module Api
  class VisitsController < ApplicationController
    before_action :set_visit, only: [ :show, :update, :destroy, :cancel, :complete ]

    def index
      @visits = scoped_visits.includes(:user, :patient)
      @visits = @visits.where(status: params[:status]) if params[:status].present?
      @visits = @visits.for_user(params[:staff_id]) if params[:staff_id].present?
      @visits = @visits.for_user(params[:user_id]) if params[:user_id].present?
      @visits = @visits.for_patient(params[:patient_id]) if params[:patient_id].present?
      @visits = @visits.on_date(Date.parse(params[:date])) if params[:date].present?
      @visits = @visits.order(scheduled_at: :asc)

      render json: @visits.as_json(
        methods: [ :staff_id ],
        include: {
          user: { only: [ :id, :name ], methods: [] },
          patient: { only: [ :id, :name ] }
        }
      ).map { |v| v.merge("staff" => v.delete("user")) }
    end

    def show
      render json: visit_json(@visit)
    end

    def create
      Visit.transaction do
        @visit = Visit.new(visit_params_with_organization)

        # ダブルブッキング防止: 悲観的ロックで競合をチェック
        check_user_conflicts!(@visit) if @visit.user_id.present?
        check_patient_conflicts!(@visit) if @visit.patient_id.present?

        @visit.save!
        render json: visit_json(@visit), status: :created
      end
    rescue DoubleBookingError => e
      render json: {
        errors: [ e.message ],
        error_type: "double_booking",
        conflict_type: e.conflict_type,
        resource_id: e.resource_id
      }, status: :conflict
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    end

    def update
      Visit.transaction do
        # 楽観的ロック: lock_versionをチェック
        check_lock_version!

        # スタッフまたは患者が変更される場合は競合チェック
        if visit_params[:user_id].present? && visit_params[:user_id].to_i != @visit.user_id
          temp_visit = @visit.dup
          temp_visit.assign_attributes(visit_params)
          check_user_conflicts!(temp_visit)
        end

        if visit_params[:patient_id].present? && visit_params[:patient_id].to_i != @visit.patient_id
          temp_visit = @visit.dup
          temp_visit.assign_attributes(visit_params)
          check_patient_conflicts!(temp_visit)
        end

        @visit.update!(visit_params_without_lock_version)
        render json: visit_json(@visit)
      end
    rescue ConcurrentModificationError, ActiveRecord::StaleObjectError => e
      stale_message = "この訪問予定は他のユーザーによって更新されました。ページを再読み込みしてください。"
      render json: {
        errors: [ e.is_a?(ConcurrentModificationError) ? e.message : stale_message ],
        error_type: "stale_object",
        current_version: @visit.reload.lock_version
      }, status: :conflict
    rescue DoubleBookingError => e
      render json: {
        errors: [ e.message ],
        error_type: "double_booking",
        conflict_type: e.conflict_type,
        resource_id: e.resource_id
      }, status: :conflict
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    end

    def destroy
      @visit.destroy
      head :no_content
    end

    def cancel
      if @visit.cancel!
        render json: visit_json(@visit)
      else
        render json: { errors: @visit.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def complete
      if @visit.complete!
        render json: visit_json(@visit)
      else
        render json: { errors: @visit.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def scoped_visits
      if current_user.organization
        current_user.organization.visits
      else
        Visit.none
      end
    end

    def visit_params_with_organization
      visit_params.merge(organization_id: current_user.organization&.id)
    end

    def set_visit
      @visit = Visit.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Visit not found" }, status: :not_found
    end

    def visit_params
      # staff_id を user_id にマッピング（後方互換性）
      permitted = params.require(:visit).permit(:scheduled_at, :duration, :staff_id, :user_id, :patient_id, :status, :notes, :planning_lane_id, :lock_version)
      permitted[:user_id] = permitted.delete(:staff_id) if permitted[:staff_id].present? && permitted[:user_id].blank?
      permitted
    end

    def visit_params_without_lock_version
      visit_params.except(:lock_version)
    end

    def check_lock_version!
      client_version = params.dig(:visit, :lock_version)&.to_i
      return unless client_version # lock_versionが送られていない場合はスキップ

      @visit.reload
      if @visit.lock_version != client_version
        raise ConcurrentModificationError
      end
    end

    def visit_json(visit)
      {
        id: visit.id,
        scheduled_at: visit.scheduled_at,
        duration: visit.duration,
        status: visit.status,
        notes: visit.notes,
        staff_id: visit.user_id,
        user_id: visit.user_id,
        patient_id: visit.patient_id,
        planning_lane_id: visit.planning_lane_id,
        lock_version: visit.lock_version,
        staff: visit.user&.as_json(only: [ :id, :name ]),
        patient: visit.patient&.as_json(only: [ :id, :name ])
      }
    end

    def check_user_conflicts!(visit)
      end_time = visit.scheduled_at + visit.duration.minutes

      conflicting = Visit.where(user_id: visit.user_id)
                         .where.not(id: visit.id)
                         .where.not(status: %w[cancelled completed])
                         .where("scheduled_at < ? AND scheduled_at + (duration * interval '1 minute') > ?",
                                end_time, visit.scheduled_at)
                         .lock
                         .exists?

      raise StaffDoubleBookingError.new(staff_id: visit.user_id) if conflicting
    end

    def check_patient_conflicts!(visit)
      end_time = visit.scheduled_at + visit.duration.minutes

      conflicting = Visit.where(patient_id: visit.patient_id)
                         .where.not(id: visit.id)
                         .where.not(status: %w[cancelled completed])
                         .where("scheduled_at < ? AND scheduled_at + (duration * interval '1 minute') > ?",
                                end_time, visit.scheduled_at)
                         .lock
                         .exists?

      raise PatientDoubleBookingError.new(patient_id: visit.patient_id) if conflicting
    end
  end
end
