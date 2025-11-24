class GroupMembership < ApplicationRecord
  belongs_to :group
  belongs_to :user

  validates :user_id, uniqueness: { scope: :group_id }

  enum role: {
    member: 0,
    leader: 1
  }
end
