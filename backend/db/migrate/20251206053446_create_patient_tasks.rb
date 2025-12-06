class CreatePatientTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :patient_tasks do |t|
      t.references :patient, null: false, foreign_key: true
      t.references :organization, null: false, foreign_key: true
      t.string :title, null: false
      t.text :content
      t.string :task_type, null: false, default: "handover"
      t.string :status, null: false, default: "open"
      t.date :due_date
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.datetime :completed_at
      t.references :completed_by, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :patient_tasks, :status
    add_index :patient_tasks, :task_type
    add_index :patient_tasks, [:organization_id, :status]
  end
end
