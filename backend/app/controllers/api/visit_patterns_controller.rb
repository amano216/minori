# frozen_string_literal: true

module Api
  class VisitPatternsController < ApplicationController
    before_action :set_visit_pattern, only: %i[show update destroy]

    # GET /api/visit_patterns
    def index
      @visit_patterns = current_user.organization.visit_patterns
                                    .includes(:patient, :default_staff, :planning_lane)

      Rails.logger.info "[VisitPatterns#index] User: #{current_user.email}, Org: #{current_user.organization_id}"
      Rails.logger.info "[VisitPatterns#index] Params: #{params.inspect}"

      # フィルタリング
      @visit_patterns = @visit_patterns.where(day_of_week: params[:day_of_week]) if params[:day_of_week].present?
      @visit_patterns = @visit_patterns.where(planning_lane_id: params[:planning_lane_id]) if params[:planning_lane_id].present?

      @visit_patterns = @visit_patterns.order(:day_of_week, :start_time)

      Rails.logger.info "[VisitPatterns#index] Returning #{@visit_patterns.count} patterns"

      render json: @visit_patterns.map { |p| pattern_json(p) }
    end

    # GET /api/visit_patterns/:id
    def show
      render json: pattern_json(@visit_pattern)
    end

    # POST /api/visit_patterns
    def create
      @visit_pattern = current_user.organization.visit_patterns.build(visit_pattern_params)

      if @visit_pattern.save
        render json: pattern_json(@visit_pattern), status: :created
      else
        render json: { errors: @visit_pattern.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # PATCH/PUT /api/visit_patterns/:id
    def update
      if @visit_pattern.update(visit_pattern_params)
        render json: pattern_json(@visit_pattern)
      else
        render json: { errors: @visit_pattern.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/visit_patterns/:id
    def destroy
      @visit_pattern.destroy
      head :no_content
    end

    # POST /api/visit_patterns/generate_visits
    def generate_visits
      start_date = Date.parse(params[:start_date])
      end_date = Date.parse(params[:end_date])
      day_of_weeks = params[:day_of_weeks]&.map(&:to_i) # Optional: filter by specific days

      Rails.logger.info "[GenerateVisits] User: #{current_user.email}, Org: #{current_user.organization_id}"
      Rails.logger.info "[GenerateVisits] Params: start=#{start_date}, end=#{end_date}, days=#{day_of_weeks.inspect}"
      Rails.logger.info "[GenerateVisits] Patterns count for org: #{current_user.organization.visit_patterns.count}"

      if end_date - start_date > 31
        return render json: { error: "生成期間は最大31日間です" }, status: :unprocessable_entity
      end

      generated = VisitPattern.generate_visits_for_period(
        current_user.organization,
        start_date,
        end_date,
        day_of_weeks: day_of_weeks
      )

      Rails.logger.info "[GenerateVisits] Generated: #{generated.size} visits"

      render json: {
        message: "#{generated.size}件の訪問を生成しました",
        count: generated.size,
        visits: generated.map { |v| visit_json(v) }
      }
    end

    private

    def set_visit_pattern
      @visit_pattern = current_user.organization.visit_patterns.find(params[:id])
    end

    def visit_pattern_params
      params.require(:visit_pattern).permit(
        :planning_lane_id, :patient_id, :default_staff_id,
        :day_of_week, :start_time, :duration, :frequency
      )
    end

    def pattern_json(pattern)
      {
        id: pattern.id,
        planning_lane_id: pattern.planning_lane_id,
        patient_id: pattern.patient_id,
        default_staff_id: pattern.default_staff_id,
        day_of_week: pattern.day_of_week,
        day_name: pattern.day_name,
        start_time: pattern.start_time_string,
        duration: pattern.duration,
        frequency: pattern.frequency,
        patient: pattern.patient ? { id: pattern.patient.id, name: pattern.patient.name, address: pattern.patient.address, status: pattern.patient.status } : nil,
        staff: pattern.default_staff ? { id: pattern.default_staff.id, name: pattern.default_staff.name } : nil,
        planning_lane: pattern.planning_lane ? { id: pattern.planning_lane.id, name: pattern.planning_lane.name } : nil,
        created_at: pattern.created_at,
        updated_at: pattern.updated_at
      }
    end

    def visit_json(visit)
      {
        id: visit.id,
        scheduled_at: visit.scheduled_at,
        patient: visit.patient ? { id: visit.patient.id, name: visit.patient.name } : nil,
        staff: visit.user ? { id: visit.user.id, name: visit.user.name } : nil,
        status: visit.status
      }
    end
  end
end
