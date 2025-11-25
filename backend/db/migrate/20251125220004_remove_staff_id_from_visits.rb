# frozen_string_literal: true

class RemoveStaffIdFromVisits < ActiveRecord::Migration[8.1]
  def change
    # staff_idのインデックスを削除
    remove_index :visits, column: [ :staff_id, :scheduled_at ], if_exists: true
    remove_index :visits, column: :staff_id, if_exists: true

    # 外部キー制約を削除
    remove_foreign_key :visits, :staffs, if_exists: true

    # staff_idカラムを削除
    remove_column :visits, :staff_id, :bigint

    # user_id + scheduled_at の複合インデックスを追加
    add_index :visits, [ :user_id, :scheduled_at ]
  end
end
