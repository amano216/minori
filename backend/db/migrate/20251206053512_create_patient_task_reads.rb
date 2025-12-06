class CreatePatientTaskReads < ActiveRecord::Migration[8.1]
  def change
    create_table :patient_task_reads do |t|
      t.references :patient_task, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.datetime :read_at, null: false, default: -> { "CURRENT_TIMESTAMP" }

      t.timestamps
    end

    add_index :patient_task_reads, [:patient_task_id, :user_id], unique: true
  end
end
