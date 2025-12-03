module Api
  class PlanningLanesController < ApplicationController
    before_action :set_planning_lane, only: [ :update, :destroy, :archive, :unarchive ]

    def index
      render json: Current.organization.planning_lanes.order(:position)
    end

    def create
      @planning_lane = Current.organization.planning_lanes.build(planning_lane_params)
      if @planning_lane.save
        render json: @planning_lane, status: :created
      else
        render json: { errors: @planning_lane.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @planning_lane.update(planning_lane_params)
        render json: @planning_lane
      else
        render json: { errors: @planning_lane.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @planning_lane.destroy
      head :no_content
    rescue ActiveRecord::InvalidForeignKey => e
      Rails.logger.warn "Cannot delete lane #{@planning_lane.id}: #{e.message}"
      render json: {
        errors: [ "このレーンには訪問パターンが紐づいているため削除できません。先に訪問を別のレーンに移動してください。" ],
        error_type: "foreign_key_violation"
      }, status: :conflict
    end

    def archive
      if @planning_lane.update(archived_at: Time.current)
        render json: @planning_lane
      else
        render json: { errors: @planning_lane.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def unarchive
      if @planning_lane.update(archived_at: nil)
        render json: @planning_lane
      else
        render json: { errors: @planning_lane.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def set_planning_lane
      @planning_lane = Current.organization.planning_lanes.find(params[:id])
    end

    def planning_lane_params
      params.require(:planning_lane).permit(:name, :position, :group_id)
    end
  end
end
