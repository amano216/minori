class User < ApplicationRecord
  has_secure_password

  ROLES = %w[admin staff].freeze

  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: -> { new_record? || !password.nil? }
  validates :role, presence: true, inclusion: { in: ROLES }

  before_save :downcase_email

  def admin?
    role == "admin"
  end

  def staff?
    role == "staff"
  end

  private

  def downcase_email
    self.email = email.downcase
  end
end
