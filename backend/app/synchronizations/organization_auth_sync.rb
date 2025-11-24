# Synchronization: Auth ←→ Organization
# Sets organization context when user authenticates
module OrganizationAuthSync
  extend ActiveSupport::Concern

  included do
    before_action :set_current_user_and_organization
  end

  private

  def set_current_user_and_organization
    if current_user
      Current.user = current_user
      Current.organization = current_user.organization
    end
  end
end
