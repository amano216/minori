class Group < ApplicationRecord
  belongs_to :organization
  belongs_to :parent, class_name: "Group", optional: true
  has_many :children, class_name: "Group", foreign_key: "parent_id", dependent: :destroy

  has_many :group_memberships, dependent: :destroy
  has_many :users, through: :group_memberships
  has_many :patients, dependent: :nullify
  has_many :staffs, dependent: :nullify

  enum :group_type, { office: 0, team: 1 }

  validates :name, presence: true

  scope :offices, -> { where(group_type: :office) }
  scope :teams, -> { where(group_type: :team) }
end
