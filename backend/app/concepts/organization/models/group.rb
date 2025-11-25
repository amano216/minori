class Group < ApplicationRecord
  belongs_to :organization
  has_many :group_memberships, dependent: :destroy
  has_many :users, through: :group_memberships
  has_many :patients, dependent: :nullify

  validates :name, presence: true

  enum :group_type, {
    team: 0,
    region: 1,
    department: 2
  }
end
