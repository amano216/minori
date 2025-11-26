class AddGroupIdToPlanningLanes < ActiveRecord::Migration[8.1]
  def change
    add_column :planning_lanes, :group_id, :integer
  end
end
