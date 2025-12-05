class Group < ApplicationRecord
  # 3省2ガイドライン準拠の監査ログ（Phase 3）
  has_paper_trail

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

  # 親グループの名前を返す（階層表示用）
  def parent_name
    parent&.name
  end

  # 階層を含めた表示名（例: "流山 > 看護"）
  def display_name
    parent_name ? "#{parent_name} > #{name}" : name
  end

  # Get all users in this group and its descendant groups (recursive)
  def all_users_including_descendants
    # Get direct users
    direct_user_ids = group_memberships.pluck(:user_id)

    # Get users from all descendant groups
    descendant_user_ids = descendant_groups.flat_map do |child_group|
      child_group.group_memberships.pluck(:user_id)
    end

    # Combine and return unique users
    all_user_ids = (direct_user_ids + descendant_user_ids).uniq
    User.where(id: all_user_ids)
  end

  # Get all descendant groups recursively
  def descendant_groups
    children.flat_map { |child| [ child ] + child.descendant_groups }
  end
end
