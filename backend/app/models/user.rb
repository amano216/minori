class User < ApplicationRecord
  has_secure_password

  # 旧ロールシステム（後方互換性のため残す）
  ROLES = %w[admin staff].freeze

  # Staff統合: 資格とステータス
  QUALIFICATIONS = %w[nurse physical_therapist occupational_therapist speech_therapist care_worker].freeze
  STAFF_STATUSES = %w[active inactive on_leave].freeze

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

  # Group (Staff統合: 直接所属)
  belongs_to :group, optional: true

  # Visits (Staff統合)
  has_many :visits, dependent: :nullify

  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: -> { new_record? || !password.nil? }
  validates :role, presence: true, inclusion: { in: ROLES }
  validates :staff_status, inclusion: { in: STAFF_STATUSES }, allow_nil: true
  validate :validate_qualifications
  validate :validate_available_hours

  before_save :downcase_email
  before_create :generate_confirmation_token

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

  # Email confirmation
  def email_confirmed?
    email_confirmed_at.present?
  end

  def confirm_email!
    update(email_confirmed_at: Time.current, confirmation_token: nil)
  end

  def generate_confirmation_token!
    update(confirmation_token: SecureRandom.urlsafe_base64(32))
  end

  # Password reset
  def generate_reset_password_token!
    update(
      reset_password_token: SecureRandom.urlsafe_base64(32),
      reset_password_sent_at: Time.current
    )
  end

  def reset_password_token_valid?
    reset_password_sent_at.present? && reset_password_sent_at > 24.hours.ago
  end

  def reset_password!(new_password)
    update(
      password: new_password,
      reset_password_token: nil,
      reset_password_sent_at: nil
    )
  end

  # OTP (One-Time Password)
  def generate_otp
    # 6桁のOTPを生成
    format("%06d", SecureRandom.random_number(1_000_000))
  end

  def save_otp(otp_code)
    # OTPを暗号化して保存（10分間有効）
    encrypted_otp = BCrypt::Password.create(otp_code)
    update(otp_secret: encrypted_otp)
  end

  def verify_otp(otp_code)
    return false if otp_secret.blank?

    BCrypt::Password.new(otp_secret) == otp_code
  rescue BCrypt::Errors::InvalidHash
    false
  end

  def otp_required?
    # 2FAが有効 かつ 最後のOTP認証から24時間以上経過
    otp_enabled && (last_otp_at.nil? || last_otp_at < 24.hours.ago)
  end

  def mark_otp_verified!
    update(last_otp_at: Time.current, otp_secret: nil)
  end

  # Staff統合: スコープ
  scope :active_staff, -> { where(staff_status: "active") }
  scope :with_qualification, ->(qual) { where("qualifications @> ?", [ qual ].to_json) }

  # Staff統合: ヘルパーメソッド
  def staff_active?
    staff_status == "active"
  end

  private

  def downcase_email
    self.email = email.downcase
  end

  def generate_confirmation_token
    self.confirmation_token = SecureRandom.urlsafe_base64(32)
  end

  def validate_qualifications
    return if qualifications.blank?

    invalid = qualifications - QUALIFICATIONS
    errors.add(:qualifications, "contains invalid values: #{invalid.join(', ')}") if invalid.any?
  end

  def validate_available_hours
    return if available_hours.blank?

    valid_days = %w[monday tuesday wednesday thursday friday saturday sunday]
    invalid_days = available_hours.keys - valid_days
    errors.add(:available_hours, "contains invalid days: #{invalid_days.join(', ')}") if invalid_days.any?
  end
end
