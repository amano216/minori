class CreateStaffs < ActiveRecord::Migration[8.1]
  def change
    create_table :staffs do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.jsonb :qualifications, default: []
      t.jsonb :available_hours, default: {}
      t.string :status, default: "active"

      t.timestamps
    end

    add_index :staffs, :email, unique: true
    add_index :staffs, :status
  end
end
