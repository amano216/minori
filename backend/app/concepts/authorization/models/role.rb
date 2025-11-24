class Role < ApplicationRecord
  has_many :user_roles, dependent: :destroy
  has_many :users, through: :user_roles

  validates :name, presence: true, uniqueness: true

  # システムロールの定義
  SUPER_ADMIN = 'super_admin'.freeze
  ORGANIZATION_ADMIN = 'organization_admin'.freeze
  GROUP_ADMIN = 'group_admin'.freeze
  STAFF = 'staff'.freeze
  VIEWER = 'viewer'.freeze

  SYSTEM_ROLES = [
    SUPER_ADMIN,
    ORGANIZATION_ADMIN,
    GROUP_ADMIN,
    STAFF,
    VIEWER
  ].freeze

  # ロールの権限レベル（数値が大きいほど権限が強い）
  ROLE_LEVELS = {
    SUPER_ADMIN => 100,
    ORGANIZATION_ADMIN => 50,
    GROUP_ADMIN => 30,
    STAFF => 10,
    VIEWER => 0
  }.freeze

  def level
    ROLE_LEVELS[name] || 0
  end

  def self.seed_roles
    SYSTEM_ROLES.each do |role_name|
      find_or_create_by!(name: role_name) do |role|
        role.description = role_description(role_name)
      end
    end
  end

  def self.role_description(role_name)
    case role_name
    when SUPER_ADMIN
      'システム全体の管理者'
    when ORGANIZATION_ADMIN
      '組織の管理者'
    when GROUP_ADMIN
      'グループの管理者'
    when STAFF
      '一般スタッフ'
    when VIEWER
      '閲覧のみ'
    end
  end
end
