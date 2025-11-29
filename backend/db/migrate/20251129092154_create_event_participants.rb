class CreateEventParticipants < ActiveRecord::Migration[8.1]
  def change
    create_table :event_participants do |t|
      t.references :event, null: false, foreign_key: true
      t.references :staff, null: false, foreign_key: { to_table: :users }
      t.string :status, null: false, default: 'confirmed'

      t.timestamps
    end

    add_index :event_participants, [ :event_id, :staff_id ], unique: true
  end
end
