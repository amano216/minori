class AddOrganizationToExistingTables < ActiveRecord::Migration[8.1]
  def change
    add_reference :users, :organization, foreign_key: true
    add_reference :patients, :organization, foreign_key: true
    add_reference :patients, :group, foreign_key: true
    add_reference :visits, :organization, foreign_key: true
  end
end
