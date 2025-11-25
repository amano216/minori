class CreatePlanningLanes < ActiveRecord::Migration[8.1]
  def change
    create_table :planning_lanes do |t|
      t.string :name
      t.integer :position
      t.references :organization, null: false, foreign_key: true

      t.timestamps
    end
  end
end
