# frozen_string_literal: true

class DropStaffsTable < ActiveRecord::Migration[8.1]
  def up
    drop_table :staffs
  end

  def down
    create_table :staffs do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.jsonb :qualifications, default: []
      t.jsonb :available_hours, default: {}
      t.string :status, default: "active"
      t.references :organization, foreign_key: true
      t.references :group, foreign_key: true

      t.timestamps
    end

    add_index :staffs, :email, unique: true
    add_index :staffs, :status
  end
end
