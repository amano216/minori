# frozen_string_literal: true

module Api
  class VisitsController < ApplicationController
    include AuthorizationVisitSync
    before_action :set_visit, only: [ :show, :update, :destroy, :cancel, :complete ]

    def index
      @visits = scoped_visits.includes(:staff, :patient)
      @visits = @visits.where(status: params[:status]) if params[:status].present?
      @visits = @visits.for_staff(params[:staff_id]) if params[:staff_id].present?
      @visits = @visits.for_patient(params[:patient_id]) if params[:patient_id].present?
      @visits = @visits.on_date(Date.parse(params[:date])) if params[:date].present?
      @visits = @visits.order(scheduled_at: :asc)

      render json: @visits.as_json(include: { staff: { only: [ :id, :name ] }, patient: { only: [ :id, :name ] } })
    end

    def show
      render json: @visit.as_json(include: { staff: { only: [ :id, :name ] }, patient: { only: [ :id, :name ] } })
    end

    def create
      @visit = Visit.new(visit_params_with_organization)

      if @visit.save
        render json: @visit.as_json(include: { staff: { only: [ :id, :name ] }, patient: { only: [ :id, :name ] } }),
               status: :created
      else
        render json: { errors: @visit.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @visit.update(visit_params)
        render json: @visit.as_json(include: { staff: { only: [ :id, :name ] }, patient: { only: [ :id, :name ] } })
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
        render json: @visit.as_json(include: { staff: { only: [ :id, :name ] }, patient: { only: [ :id, :name ] } })
      else
        render json: { errors: @visit.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def complete
      if @visit.complete!
        render json: @visit.as_json(include: { staff: { only: [ :id, :name ] }, patient: { only: [ :id, :name ] } })
      else
        render json: { errors: @visit.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def set_visit
      @visit = Visit.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Visit not found" }, status: :not_found
    end

    def visit_params
      params.require(:visit).permit(:scheduled_at, :duration, :staff_id, :patient_id, :status, :notes, :planning_lane_id)
    end
  end
end
