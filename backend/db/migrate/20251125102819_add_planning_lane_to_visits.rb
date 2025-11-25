class AddPlanningLaneToVisits < ActiveRecord::Migration[8.1]
  def change
    add_reference :visits, :planning_lane, null: true, foreign_key: true
  end
end
