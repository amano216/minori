# frozen_string_literal: true

class MigrateStaffDataToUsers < ActiveRecord::Migration[8.1]
  def up
    # Staffデータを対応するUserに移行
    execute <<-SQL
      UPDATE users
      SET
        qualifications = staffs.qualifications,
        available_hours = staffs.available_hours,
        staff_status = staffs.status,
        group_id = staffs.group_id
      FROM staffs
      WHERE users.email = staffs.email
    SQL

    # Visitsのstaff_idをuser_idに移行（emailで対応付け）
    execute <<-SQL
      UPDATE visits
      SET user_id = users.id
      FROM users
      INNER JOIN staffs ON staffs.email = users.email
      WHERE visits.staff_id = staffs.id
    SQL
  end

  def down
    # user_id を null に戻す
    execute "UPDATE visits SET user_id = NULL"

    # Userのstaff属性をクリア
    execute <<-SQL
      UPDATE users
      SET
        qualifications = '[]'::jsonb,
        available_hours = '{}'::jsonb,
        staff_status = 'active',
        group_id = NULL
    SQL
  end
end
