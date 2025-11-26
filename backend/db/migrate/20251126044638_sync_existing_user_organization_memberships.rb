class SyncExistingUserOrganizationMemberships < ActiveRecord::Migration[8.1]
  def up
    # For all users with organization_id set, ensure they have a corresponding organization_membership
    User.where.not(organization_id: nil).find_each do |user|
      unless OrganizationMembership.exists?(user_id: user.id, organization_id: user.organization_id)
        OrganizationMembership.create!(user_id: user.id, organization_id: user.organization_id)
        puts "✅ Created organization_membership for user #{user.id} (#{user.name}) in organization #{user.organization_id}"
      end
    end
  end

  def down
    # This migration is data-only and reversible by deleting the created records
    # But we'll leave them as they represent valid relationships
  end
end
