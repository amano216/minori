# frozen_string_literal: true

module Api
  class StaffsController < ApplicationController
    before_action :set_staff, only: %i[show update destroy]

    # Staff は User モデルに統合されました
    # このコントローラーは後方互換性のために維持しています

    def index
      @staffs = organization_users.where.not(staff_status: nil)
      @staffs = @staffs.where(staff_status: params[:status]) if params[:status].present?
      @staffs = @staffs.with_qualification(params[:qualification]) if params[:qualification].present?
      @staffs = @staffs.order(created_at: :desc)

      render json: @staffs.as_json(only: staff_attributes)
    end

    def show
      render json: @staff.as_json(only: staff_attributes)
    end

    def create
      @staff = organization_users.new(staff_params)
      @staff.staff_status ||= "active"
      @staff.role = "staff"
      # パスワードを自動生成（後でメールで変更リンク送信想定）
      @staff.password = SecureRandom.hex(16) unless @staff.password.present?

      if @staff.save
        render json: @staff.as_json(only: staff_attributes), status: :created
      else
        render json: { errors: @staff.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @staff.update(staff_params)
        render json: @staff.as_json(only: staff_attributes)
      else
        render json: { errors: @staff.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @staff.destroy
      head :no_content
    end

    private

    def organization_users
      Current.organization&.users || User.none
    end

    def set_staff
      @staff = organization_users.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Staff not found" }, status: :not_found
    end

    def staff_params
      params.require(:staff).permit(:name, :email, :staff_status, :group_id, qualifications: [], available_hours: {})
    end

    def staff_attributes
      [ :id, :name, :email, :staff_status, :qualifications, :available_hours, :group_id, :organization_id, :created_at, :updated_at ]
    end
  end
end
