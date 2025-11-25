module Api
  module Admin
    class GroupsController < ApplicationController
      before_action :authorize_admin!
      before_action :set_group, only: [ :show, :update, :destroy ]

      def index
        @groups = current_user.organization.groups
                              .includes(:users)
                              .order(:name)
        render json: @groups, include: [ :users ]
      end

      def show
        render json: @group, include: [ :users, :patients ]
      end

      def create
        @group = current_user.organization.groups.new(group_params)

        if @group.save
          render json: @group, status: :created
        else
          render json: { errors: @group.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @group.update(group_params)
          render json: @group
        else
          render json: { errors: @group.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @group.destroy
        head :no_content
      end

      private

      def set_group
        @group = current_user.organization.groups.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Group not found" }, status: :not_found
      end

      def group_params
        params.require(:group).permit(:name, :description, :parent_id, :group_type)
      end

      def authorize_admin!
        unless current_user.has_role?(User::GROUP_ADMIN)
          render json: { error: "Unauthorized" }, status: :forbidden
        end
      end
    end
  end
end
