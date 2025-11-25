class Group < ApplicationRecord
  belongs_to :organization
  has_many :group_memberships, dependent: :destroy
  has_many :users, through: :group_memberships
  has_many :patients, dependent: :nullify

  validates :name, presence: true
end
