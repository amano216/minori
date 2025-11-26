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
        if @visit.user_id.present?
          check_user_conflicts!(@visit)
        end

        if @visit.patient_id.present?
          check_patient_conflicts!(@visit)
        end

        @visit.save!
        render json: visit_json(@visit), status: :created
      end
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    rescue StandardError => e
      render json: { errors: [e.message] }, status: :unprocessable_entity
    end

    def update
      Visit.transaction do
        # 楽観的ロックでStaleObjectErrorが発生する可能性がある
        @visit.reload

        # スタッフまたは患者が変更される場合は競合チェック
        if visit_params[:user_id].present? && visit_params[:user_id] != @visit.user_id
          temp_visit = @visit.dup
          temp_visit.assign_attributes(visit_params)
          check_user_conflicts!(temp_visit)
        end

        if visit_params[:patient_id].present? && visit_params[:patient_id] != @visit.patient_id
          temp_visit = @visit.dup
          temp_visit.assign_attributes(visit_params)
          check_patient_conflicts!(temp_visit)
        end

        @visit.update!(visit_params)
        render json: visit_json(@visit)
      end
    rescue ActiveRecord::StaleObjectError
      render json: { errors: ["この訪問予定は他のユーザーによって更新されました。ページを再読み込みしてください。"] }, status: :conflict
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    rescue StandardError => e
      render json: { errors: [e.message] }, status: :unprocessable_entity
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
      permitted = params.require(:visit).permit(:scheduled_at, :duration, :staff_id, :user_id, :patient_id, :status, :notes, :planning_lane_id)
      permitted[:user_id] = permitted.delete(:staff_id) if permitted[:staff_id].present? && permitted[:user_id].blank?
      permitted
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

      raise "スタッフは既に別の訪問が予定されています" if conflicting
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

      raise "患者は既に別の訪問が予定されています" if conflicting
    end
  end
end
