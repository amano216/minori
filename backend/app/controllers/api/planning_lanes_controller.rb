module Api
  class PlanningLanesController < ApplicationController
    before_action :set_planning_lane, only: [ :update, :destroy ]

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
