# Synchronization: Authorization ←→ Patient
# Enforces access control for patient resources
module AuthorizationPatientSync
  extend ActiveSupport::Concern

  included do
    before_action :set_organization_scope, only: [:index, :create]
    before_action :set_patient, only: [:show, :update, :destroy]
    before_action :authorize_patient_action
  end

  private

  def set_organization_scope
    @organization = Current.organization
  end

  def set_patient
    @patient = Patient.find(params[:id])
  end

  def authorize_patient_action
    action = action_name
    resource = @patient || Patient

    unless Authorization::Authorize.can?(current_user, action, resource)
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end

  # Override index to scope by organization
  def scoped_patients
    if current_user.has_role?(Role::SUPER_ADMIN)
      Patient.all
    elsif @organization
      @organization.patients
    else
      Patient.none
    end
  end

  # Set organization on create
  def patient_params_with_organization
    params.require(:patient).permit(:name, :address, :phone, :care_requirements, :notes, :status, :group_id).tap do |p|
      p[:organization_id] = Current.organization&.id if Current.organization
    end
  end
end
