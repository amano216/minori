class UserRole < ApplicationRecord
  belongs_to :user
  belongs_to :role
  belongs_to :organization, optional: true
  belongs_to :group, optional: true

  validates :user_id, uniqueness: { scope: [ :role_id, :organization_id ] }
end
