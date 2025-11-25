class AddHierarchyToGroups < ActiveRecord::Migration[8.1]
  def change
    add_reference :groups, :parent, null: true, foreign_key: { to_table: :groups }
  end
end
