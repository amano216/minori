class Role < ApplicationRecord
  has_many :user_roles, dependent: :destroy
  has_many :users, through: :user_roles

  validates :name, presence: true, uniqueness: true

  # 定義済みロール
  SUPER_ADMIN = "super_admin"
  ORGANIZATION_ADMIN = "organization_admin"
  GROUP_ADMIN = "group_admin"
  STAFF = "staff"
  VIEWER = "viewer"
end
