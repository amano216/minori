# frozen_string_literal: true

class AddStaffAttributesToUsers < ActiveRecord::Migration[8.1]
  def change
    # Staffモデルの属性をUserモデルに追加
    add_column :users, :qualifications, :jsonb, default: []
    add_column :users, :available_hours, :jsonb, default: {}
    add_column :users, :staff_status, :string, default: "active"
    add_reference :users, :group, foreign_key: true

    # staff_status用のインデックス
    add_index :users, :staff_status
  end
end
