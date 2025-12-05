class AddPositionToGroups < ActiveRecord::Migration[8.1]
  def change
    add_column :groups, :position, :integer
    add_index :groups, [:organization_id, :position]
  end
end
