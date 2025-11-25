# frozen_string_literal: true

module Api
  class StaffsController < ApplicationController
    before_action :set_staff, only: %i[show update destroy]

    def index
      @staffs = Current.organization.staffs
      @staffs = @staffs.where(status: params[:status]) if params[:status].present?
      @staffs = @staffs.with_qualification(params[:qualification]) if params[:qualification].present?
      @staffs = @staffs.order(created_at: :desc)

      render json: @staffs
    end

    def show
      render json: @staff
    end

    def create
      @staff = Current.organization.staffs.new(staff_params)

      if @staff.save
        render json: @staff, status: :created
      else
        render json: { errors: @staff.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @staff.update(staff_params)
        render json: @staff
      else
        render json: { errors: @staff.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @staff.destroy
      head :no_content
    end

    private

    def set_staff
      @staff = Current.organization.staffs.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Staff not found" }, status: :not_found
    end

    def staff_params
      params.require(:staff).permit(:name, :email, :status, :group_id, qualifications: [], available_hours: {})
    end
  end
end
