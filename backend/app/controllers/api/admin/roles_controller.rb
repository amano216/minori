module Api
  module Admin
    class RolesController < ApplicationController
      before_action :authenticate_request!
      before_action :authorize_admin!
      before_action :set_role, only: [ :show, :update, :destroy ]

      def index
        @roles = Role.all.order(:name)
        render json: @roles
      end

      def show
        render json: @role, include: [ :users ]
      end

      def create
        @role = Role.new(role_params)

        if @role.save
          render json: @role, status: :created
        else
          render json: { errors: @role.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @role.update(role_params)
          render json: @role
        else
          render json: { errors: @role.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        if @role.users.any?
          render json: { error: "Cannot delete role with assigned users" }, status: :unprocessable_entity
          return
        end

        @role.destroy
        head :no_content
      end

      private

      def set_role
        @role = Role.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Role not found" }, status: :not_found
      end

      def role_params
        params.require(:role).permit(:name, :description)
      end

      def authorize_admin!
        unless current_user.has_role?("organization_admin") || current_user.has_role?("super_admin")
          render json: { error: "Unauthorized" }, status: :forbidden
        end
      end
    end
  end
end
