class User < ApplicationRecord
  has_secure_password

  # 旧ロールシステム（後方互換性のため残す）
  ROLES = %w[admin staff].freeze

  # Organization Concept
  belongs_to :organization, optional: true
  has_many :organization_memberships, dependent: :destroy
  has_many :organizations, through: :organization_memberships

  # Authorization Concept
  has_many :user_roles, dependent: :destroy
  has_many :roles, through: :user_roles

  # Group memberships
  has_many :group_memberships, dependent: :destroy
  has_many :groups, through: :group_memberships

  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: -> { new_record? || !password.nil? }
  validates :role, presence: true, inclusion: { in: ROLES }

  before_save :downcase_email

  # 旧メソッド（後方互換性）
  def admin?
    role == "admin"
  end

  def staff?
    role == "staff"
  end

  # 新しいロールシステムのメソッド
  def role_in_organization(organization)
    user_roles.joins(:role).find_by(organization: organization)&.role
  end

  def has_role?(role_name, organization: nil, group: nil)
    query = user_roles.joins(:role).where(roles: { name: role_name })
    query = query.where(organization: organization) if organization
    query = query.where(group: group) if group
    query.exists?
  end

  def max_role_level(organization: nil)
    query = user_roles.joins(:role)
    query = query.where(organization: organization) if organization

    query.maximum('CASE
      WHEN roles.name = ? THEN 100
      WHEN roles.name = ? THEN 50
      WHEN roles.name = ? THEN 30
      WHEN roles.name = ? THEN 10
      ELSE 0
    END', Role::SUPER_ADMIN, Role::ORGANIZATION_ADMIN, Role::GROUP_ADMIN, Role::STAFF) || 0
  end

  private

  def downcase_email
    self.email = email.downcase
  end
end
