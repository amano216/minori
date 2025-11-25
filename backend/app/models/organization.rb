class Organization < ApplicationRecord
  has_many :organization_memberships, dependent: :destroy
  has_many :users, through: :organization_memberships
  has_many :groups, dependent: :destroy
  has_many :patients, dependent: :nullify
  has_many :visits, dependent: :nullify

  validates :name, presence: true
  validates :subdomain, uniqueness: true, allow_nil: true
end
