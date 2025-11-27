class CreateVisitPatterns < ActiveRecord::Migration[8.1]
  def change
    create_table :visit_patterns do |t|
      t.references :planning_lane, foreign_key: true
      t.references :patient, null: false, foreign_key: true
      t.references :organization, null: false, foreign_key: true
      t.references :default_staff, foreign_key: { to_table: :users }
      t.integer :day_of_week, null: false
      t.time :start_time, null: false
      t.integer :duration, default: 60

      t.timestamps
    end

    add_index :visit_patterns, [ :organization_id, :day_of_week ]
    add_index :visit_patterns, [ :planning_lane_id, :day_of_week ]

    # visitsテーブルにvisit_pattern_idを追加
    add_reference :visits, :visit_pattern, foreign_key: true
  end
end
