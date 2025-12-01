class Organization < ApplicationRecord
  # 3省2ガイドライン準拠の監査ログ（Phase 3）
  has_paper_trail

  has_many :organization_memberships, dependent: :destroy
  has_many :users, through: :organization_memberships
  has_many :groups, dependent: :destroy
  has_many :patients, dependent: :nullify
  has_many :visits, dependent: :nullify
  has_many :visit_patterns, dependent: :destroy
  has_many :staffs, dependent: :destroy
  has_many :planning_lanes, dependent: :destroy
  has_many :events, dependent: :destroy

  validates :name, presence: true
  validates :subdomain, uniqueness: true, allow_nil: true
end
