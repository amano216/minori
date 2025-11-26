class SyncExistingUserGroupMemberships < ActiveRecord::Migration[8.1]
  def up
    # For all users with group_id set, ensure they have a corresponding group_membership
    User.where.not(group_id: nil).find_each do |user|
      unless GroupMembership.exists?(user_id: user.id, group_id: user.group_id)
        GroupMembership.create!(user_id: user.id, group_id: user.group_id)
        puts "✅ Created group_membership for user #{user.id} in group #{user.group_id}"
      end
    end
  end

  def down
    # This migration is data-only and reversible by deleting the created records
    # But we'll leave them as they represent valid relationships
  end
end
