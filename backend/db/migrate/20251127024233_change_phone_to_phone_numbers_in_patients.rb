class ChangePhoneToPhoneNumbersInPatients < ActiveRecord::Migration[8.1]
  def up
    # 新しいJSONBカラムを追加
    add_column :patients, :phone_numbers, :jsonb, default: []

    # 既存の電話番号データを移行
    execute <<-SQL
      UPDATE patients
      SET phone_numbers = CASE
        WHEN phone IS NOT NULL AND phone != ''
        THEN jsonb_build_array(jsonb_build_object('number', phone, 'label', '電話'))
        ELSE '[]'::jsonb
      END
    SQL

    # 古いカラムを削除
    remove_column :patients, :phone
  end

  def down
    add_column :patients, :phone, :string

    # 最初の電話番号を復元
    execute <<-SQL
      UPDATE patients
      SET phone = phone_numbers->0->>'number'
      WHERE jsonb_array_length(phone_numbers) > 0
    SQL

    remove_column :patients, :phone_numbers
  end
end
