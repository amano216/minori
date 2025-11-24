class Organization < ApplicationRecord
  has_many :groups, dependent: :destroy
  has_many :organization_memberships, dependent: :destroy
  has_many :users, through: :organization_memberships
  has_many :patients, dependent: :nullify
  has_many :visits, dependent: :nullify

  validates :name, presence: true
  validates :subdomain, presence: true, uniqueness: true
  validates :plan, inclusion: { in: %w[free standard premium] }

  # デフォルト設定
  after_initialize :set_default_settings, if: :new_record?

  private

  def set_default_settings
    self.settings ||= {
      timezone: 'Asia/Tokyo',
      business_hours: {
        start: '09:00',
        end: '18:00'
      }
    }
  end
end
