class AddGroupIdToPlanningLanes < ActiveRecord::Migration[8.1]
  def change
    add_column :planning_lanes, :group_id, :bigint, null: true
    add_index :planning_lanes, :group_id
    add_foreign_key :planning_lanes, :groups
  end
end
