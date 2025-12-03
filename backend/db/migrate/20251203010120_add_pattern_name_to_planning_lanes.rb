class AddPatternNameToPlanningLanes < ActiveRecord::Migration[8.1]
  def change
    add_column :planning_lanes, :pattern_name, :string
  end
end
