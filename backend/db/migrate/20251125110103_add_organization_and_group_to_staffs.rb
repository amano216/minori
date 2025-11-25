class AddOrganizationAndGroupToStaffs < ActiveRecord::Migration[8.1]
  def change
    add_reference :staffs, :organization, null: true, foreign_key: true
    add_reference :staffs, :group, null: true, foreign_key: true
  end
end
