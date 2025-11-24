# Authorization Concept - Service
# Handles permission checks and access control
module Authorization
  class Authorize
    # Check if user can perform action on resource
    def self.can?(user, action, resource)
      return false unless user

      # Super admin can do everything
      return true if user.has_role?(Role::SUPER_ADMIN)

      case resource
      when Patient
        can_access_patient?(user, action, resource)
      when Visit
        can_access_visit?(user, action, resource)
      when User
        can_access_user?(user, action, resource)
      when Group
        can_access_group?(user, action, resource)
      when Organization
        can_access_organization?(user, action, resource)
      else
        false
      end
    end

    # Get accessible resources for user
    def self.accessible_resources(user, resource_class)
      return resource_class.none unless user

      # Super admin sees everything
      return resource_class.all if user.has_role?(Role::SUPER_ADMIN)

      # Organization scoped
      if user.organization
        resource_class.where(organization: user.organization)
      else
        resource_class.none
      end
    end

    private

    # Patient access control
    def self.can_access_patient?(user, action, patient)
      org = patient.organization || Current.organization

      case action.to_s
      when 'show', 'index'
        # Can view patients in same organization or group
        user.organization_id == org&.id ||
          (patient.group && user.groups.include?(patient.group))
      when 'create'
        # Organization admin or group admin can create
        user.has_role?(Role::ORGANIZATION_ADMIN, organization: org) ||
          user.has_role?(Role::GROUP_ADMIN, organization: org)
      when 'update', 'destroy'
        # Organization admin can update/delete
        user.has_role?(Role::ORGANIZATION_ADMIN, organization: org)
      else
        false
      end
    end

    # Visit access control
    def self.can_access_visit?(user, action, visit)
      org = visit.organization || Current.organization

      case action.to_s
      when 'show', 'index'
        # Can view visits in same organization
        user.organization_id == org&.id
      when 'create', 'update'
        # Staff and above can create/update visits
        user.has_role?(Role::STAFF, organization: org) ||
          user.has_role?(Role::GROUP_ADMIN, organization: org) ||
          user.has_role?(Role::ORGANIZATION_ADMIN, organization: org)
      when 'destroy'
        # Only organization admin can delete visits
        user.has_role?(Role::ORGANIZATION_ADMIN, organization: org)
      else
        false
      end
    end

    # User access control
    def self.can_access_user?(user, action, target_user)
      org = target_user.organization || Current.organization

      case action.to_s
      when 'show', 'index'
        # Can view users in same organization
        user.organization_id == org&.id
      when 'create', 'update', 'destroy'
        # Only organization admin can manage users
        user.has_role?(Role::ORGANIZATION_ADMIN, organization: org)
      else
        false
      end
    end

    # Group access control
    def self.can_access_group?(user, action, group)
      org = group.organization

      case action.to_s
      when 'show', 'index'
        # Can view groups in same organization
        user.organization_id == org.id
      when 'create', 'update', 'destroy'
        # Organization admin or group admin can manage groups
        user.has_role?(Role::ORGANIZATION_ADMIN, organization: org) ||
          user.has_role?(Role::GROUP_ADMIN, group: group)
      else
        false
      end
    end

    # Organization access control
    def self.can_access_organization?(user, action, organization)
      case action.to_s
      when 'show'
        # Can view own organization
        user.organization_id == organization.id
      when 'update'
        # Only organization admin can update
        user.has_role?(Role::ORGANIZATION_ADMIN, organization: organization)
      when 'create', 'destroy'
        # Only super admin can create/destroy organizations
        user.has_role?(Role::SUPER_ADMIN)
      else
        false
      end
    end
  end
end
