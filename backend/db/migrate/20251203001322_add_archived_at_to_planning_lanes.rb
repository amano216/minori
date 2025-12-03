class AddArchivedAtToPlanningLanes < ActiveRecord::Migration[8.1]
  def change
    add_column :planning_lanes, :archived_at, :datetime
  end
end
