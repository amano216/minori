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
      @visit = Visit.new(visit_params_with_organization)

      if @visit.save
        render json: visit_json(@visit), status: :created
      else
        render json: { errors: @visit.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @visit.update(visit_params)
        render json: visit_json(@visit)
      else
        render json: { errors: @visit.errors.full_messages }, status: :unprocessable_entity
      end
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
        staff: visit.user&.as_json(only: [ :id, :name ]),
        patient: visit.patient&.as_json(only: [ :id, :name ])
      }
    end
  end
end
