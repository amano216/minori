# frozen_string_literal: true

module Api
  class PatientsController < ApplicationController
    before_action :set_patient, only: %i[show update destroy]

    def index
      @patients = Patient.all
      @patients = @patients.where(status: params[:status]) if params[:status].present?
      @patients = @patients.with_care_requirement(params[:care_requirement]) if params[:care_requirement].present?
      @patients = @patients.order(created_at: :desc)

      render json: @patients
    end

    def show
      render json: @patient
    end

    def create
      @patient = Patient.new(patient_params)

      if @patient.save
        render json: @patient, status: :created
      else
        render json: { errors: @patient.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @patient.update(patient_params)
        render json: @patient
      else
        render json: { errors: @patient.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @patient.destroy
      head :no_content
    end

    private

    def set_patient
      @patient = Patient.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Patient not found" }, status: :not_found
    end

    def patient_params
      params.require(:patient).permit(:name, :address, :phone, :notes, :status, care_requirements: [])
    end
  end
end
