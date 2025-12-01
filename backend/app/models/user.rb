class User < ApplicationRecord
  # 3省2ガイドライン準拠の監査ログ（Phase 2）
  has_paper_trail

  has_secure_password

  # ロールシステム（シンプル化）
  SUPER_ADMIN = "super_admin"
  ORGANIZATION_ADMIN = "organization_admin"
  STAFF = "staff"

  ROLES = [ SUPER_ADMIN, ORGANIZATION_ADMIN, STAFF ].freeze

  # ロールレベル（権限の強さ）
  ROLE_LEVELS = {
    SUPER_ADMIN => 100,
    ORGANIZATION_ADMIN => 50,
    STAFF => 10
  }.freeze

  # Staff統合: 資格とステータス
  QUALIFICATIONS = %w[nurse physical_therapist occupational_therapist speech_therapist care_worker].freeze
  STAFF_STATUSES = %w[active inactive on_leave].freeze

  # Organization Concept
  belongs_to :organization, optional: true
  has_many :organization_memberships, dependent: :destroy
  has_many :organizations, through: :organization_memberships

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
  after_create :create_organization_membership
  after_save :sync_group_membership

  # ロールチェックメソッド
  def super_admin?
    role == SUPER_ADMIN
  end

  def organization_admin?
    role == ORGANIZATION_ADMIN
  end

  def staff?
    role == STAFF
  end

  # 後方互換性のためのエイリアス
  def admin?
    organization_admin? || super_admin?
  end

  # ロールレベルを取得
  def role_level
    ROLE_LEVELS[role] || 0
  end

  # 指定したロール以上の権限を持っているか
  def has_role?(role_name, organization: nil, group: nil)
    # シンプル化: users.role でチェック
    target_level = ROLE_LEVELS[role_name.to_s] || 0
    role_level >= target_level
  end

  # 指定したロールと完全一致するか
  def is_role?(role_name)
    role == role_name.to_s
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

  # Create organization_membership after user creation
  def create_organization_membership
    return unless organization_id.present?
    return if organization_memberships.exists?(organization_id: organization_id)

    organization_memberships.create(organization_id: organization_id)
    Rails.logger.info "✅ Created organization_membership for user #{id} in organization #{organization_id}"
  end

  # Sync group_memberships when group_id changes
  def sync_group_membership
    return unless saved_change_to_group_id?

    Rails.logger.info "🔄 Syncing group membership for user #{id}: #{group_id_before_last_save} -> #{group_id}"

    # Remove old group membership
    if group_id_before_last_save.present?
      removed = group_memberships.where(group_id: group_id_before_last_save).destroy_all
      Rails.logger.info "  ❌ Removed #{removed.size} old membership(s) from group #{group_id_before_last_save}"
    end

    # Add new group membership
    if group_id.present?
      if !group_memberships.exists?(group_id: group_id)
        new_membership = group_memberships.create(group_id: group_id)
        Rails.logger.info "  ✅ Created new membership in group #{group_id}: #{new_membership.persisted?}"
      else
        Rails.logger.info "  ℹ️  Membership already exists in group #{group_id}"
      end
    end
  end
end
