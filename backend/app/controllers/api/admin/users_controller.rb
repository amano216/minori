module Api
  module Admin
    class UsersController < ApplicationController
      before_action :authorize_admin!
      before_action :set_user, only: [ :show, :update, :destroy ]

      def index
        @users = current_user.organization.users
                             .includes(:groups)
                             .order(created_at: :desc)
        render json: @users, include: [ :groups ]
      end

      def show
        render json: @user, include: [ :groups, :organization ]
      end

      def create
        Rails.logger.info "👤 Creating new user: params=#{params[:user].inspect}"
        @user = User.new(user_params)
        @user.organization = current_user.organization

        # Set default role if not provided
        @user.role ||= User::STAFF

        if @user.save
          Rails.logger.info "✅ User created successfully. id=#{@user.id}, group_id=#{@user.group_id}, role=#{@user.role}"
          render json: @user, status: :created
        else
          Rails.logger.error "❌ User creation failed: #{@user.errors.full_messages.inspect}"
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        Rails.logger.info "👤 Updating user #{@user.id}: params=#{user_params.inspect}"
        if @user.update(user_params)
          Rails.logger.info "✅ User updated successfully. group_id=#{@user.group_id}"
          render json: @user
        else
          Rails.logger.error "❌ User update failed: #{@user.errors.full_messages}"
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        if @user == current_user
          render json: { error: "Cannot delete yourself" }, status: :forbidden
          return
        end

        @user.destroy
        head :no_content
      end

      private

      def set_user
        @user = current_user.organization.users.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "User not found" }, status: :not_found
      end

      def user_params
        permitted = params.require(:user).permit(
          :email, :password, :password_confirmation, :name,
          :staff_status, :group_id, qualifications: [], available_hours: {}
        )
        # roleの変更は管理者のみ許可し、自分より高いロールへの変更は禁止
        if params.dig(:user, :role).present? && can_assign_role?(params[:user][:role])
          permitted[:role] = params[:user][:role]
        end
        permitted
      end

      def can_assign_role?(target_role)
        return false unless User::ROLES.include?(target_role)
        # 自分より高いロールは割り当て不可
        target_level = User::ROLE_LEVELS[target_role] || 0
        current_user.role_level >= target_level
      end

      def authorize_admin!
        unless current_user.admin?
          render json: { error: "Unauthorized" }, status: :forbidden
        end
      end
    end
  end
end
