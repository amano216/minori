# frozen_string_literal: true

module Api
  class PatientsController < ApplicationController
    def index
      @patients = scoped_patients
      @patients = @patients.where(status: params[:status]) if params[:status].present?
      @patients = @patients.with_care_requirement(params[:care_requirement]) if params[:care_requirement].present?
      @patients = @patients.order(created_at: :desc)

      render json: @patients
    end

    def show
      render json: @patient
    end

    def create
      @patient = Patient.new(patient_params_with_organization)

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

    def scoped_patients
      if current_user.organization
        current_user.organization.patients
      else
        Patient.none
      end
    end

    def patient_params_with_organization
      patient_params.merge(organization_id: current_user.organization&.id)
    end

    def patient_params
      params.require(:patient).permit(:name, :address, :phone, :notes, :status, :group_id, care_requirements: [])
    end
  end
end
