class UserRole < ApplicationRecord
  belongs_to :user
  belongs_to :role
  belongs_to :organization, optional: true
  belongs_to :group, optional: true

  validates :user_id, uniqueness: { scope: [ :role_id, :organization_id ] }

  # スコープの検証
  validate :validate_scope

  private

  def validate_scope
    # organization_adminはorganization_idが必須
    if role&.name == Role::ORGANIZATION_ADMIN && organization_id.blank?
      errors.add(:organization_id, "は組織管理者には必須です")
    end

    # group_adminはgroup_idが必須
    if role&.name == Role::GROUP_ADMIN && group_id.blank?
      errors.add(:group_id, "はグループ管理者には必須です")
    end

    # super_adminはorganization_idとgroup_idを持たない
    if role&.name == Role::SUPER_ADMIN && (organization_id.present? || group_id.present?)
      errors.add(:base, "スーパー管理者は組織やグループに紐づけられません")
    end
  end
end
