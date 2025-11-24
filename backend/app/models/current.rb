# Current attributes for request-scoped data
# Synchronization: Auth ←→ Organization
class Current < ActiveSupport::CurrentAttributes
  attribute :user
  attribute :organization
  attribute :request_id

  def user=(user)
    super
    self.organization = user&.organization
  end
end
