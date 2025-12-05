class AddStatusAndPositionToGroups < ActiveRecord::Migration[8.1]
  def change
    add_column :groups, :status, :string, default: "active" unless column_exists?(:groups, :status)
    add_column :groups, :position, :integer unless column_exists?(:groups, :position)
  end
end
