class CreateEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :events do |t|
      t.string :title, null: false
      t.string :event_type, null: false, default: 'meeting'
      t.datetime :scheduled_at, null: false
      t.integer :duration, null: false, default: 60
      t.text :notes
      t.references :planning_lane, foreign_key: true
      t.references :organization, null: false, foreign_key: true

      t.timestamps
    end

    add_index :events, :scheduled_at
    add_index :events, :event_type
  end
end
