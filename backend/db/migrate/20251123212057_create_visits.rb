class CreateVisits < ActiveRecord::Migration[8.1]
  def change
    create_table :visits do |t|
      t.datetime :scheduled_at, null: false
      t.integer :duration, default: 60, null: false
      t.references :staff, foreign_key: true
      t.references :patient, null: false, foreign_key: true
      t.string :status, default: "scheduled", null: false
      t.text :notes

      t.timestamps
    end

    add_index :visits, :scheduled_at
    add_index :visits, :status
    add_index :visits, [ :staff_id, :scheduled_at ]
  end
end
