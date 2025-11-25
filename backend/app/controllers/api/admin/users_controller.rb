module Api
  module Admin
    class UsersController < ApplicationController
      before_action :authenticate_user!
      before_action :authorize_admin!
      before_action :set_user, only: [:show, :update, :destroy]

      def index
        @users = current_user.organization.users
                             .includes(:roles, :groups)
                             .order(created_at: :desc)
        render json: @users, include: [:roles, :groups]
      end

      def show
        render json: @user, include: [:roles, :groups, :organization]
      end

      def create
        @user = User.new(user_params)
        @user.organization = current_user.organization

        if @user.save
          render json: @user, status: :created
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @user.update(user_params)
          render json: @user
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        if @user == current_user
          render json: { error: 'Cannot delete yourself' }, status: :forbidden
          return
        end

        @user.destroy
        head :no_content
      end

      private

      def set_user
        @user = current_user.organization.users.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'User not found' }, status: :not_found
      end

      def user_params
        params.require(:user).permit(:email, :password, :password_confirmation, :role, :name)
      end

      def authorize_admin!
        unless current_user.has_role?('organization_admin') || current_user.has_role?('super_admin')
          render json: { error: 'Unauthorized' }, status: :forbidden
        end
      end
    end
  end
end
