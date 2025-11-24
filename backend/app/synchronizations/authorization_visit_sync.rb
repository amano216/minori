# Synchronization: Authorization ←→ Visit
# Enforces access control for visit resources
module AuthorizationVisitSync
  extend ActiveSupport::Concern

  included do
    before_action :set_organization_scope, only: [:index, :create]
    before_action :set_visit, only: [:show, :update, :destroy]
    before_action :authorize_visit_action
    before_action :validate_cross_organization, only: [:create, :update]
  end

  private

  def set_organization_scope
    @organization = Current.organization
  end

  def set_visit
    @visit = Visit.find(params[:id])
  end

  def authorize_visit_action
    action = action_name
    resource = @visit || Visit

    unless Authorization::Authorize.can?(current_user, action, resource)
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end

  # Prevent cross-organization visits
  def validate_cross_organization
    patient_id = params.dig(:visit, :patient_id) || @visit&.patient_id
    staff_id = params.dig(:visit, :user_id) || @visit&.user_id

    if patient_id && staff_id
      patient = Patient.find_by(id: patient_id)
      staff = User.find_by(id: staff_id)

      if patient && staff && patient.organization_id != staff.organization_id
        render json: { error: '異なる組織間の訪問予定は作成できません' }, status: :unprocessable_entity
      end
    end
  end

  # Override index to scope by organization
  def scoped_visits
    if current_user.has_role?(Role::SUPER_ADMIN)
      Visit.all
    elsif @organization
      @organization.visits
    else
      Visit.none
    end
  end

  # Set organization on create
  def visit_params_with_organization
    params.require(:visit).permit(:patient_id, :user_id, :scheduled_at, :duration, :status, :notes).tap do |p|
      p[:organization_id] = Current.organization&.id if Current.organization
    end
  end
end
