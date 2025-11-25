# frozen_string_literal: true

class AddUserIdToVisits < ActiveRecord::Migration[8.1]
  def change
    # visits テーブルに user_id を追加
    add_reference :visits, :user, foreign_key: true

    # staff_id から user_id へのデータ移行は別のマイグレーションで実行
  end
end
