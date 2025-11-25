# frozen_string_literal: true

class ExpandUserRoles < ActiveRecord::Migration[8.1]
  def up
    # 既存の admin を organization_admin に変更
    execute <<-SQL
      UPDATE users SET role = 'organization_admin' WHERE role = 'admin'
    SQL

    # staff はそのまま維持
  end

  def down
    # organization_admin を admin に戻す
    execute <<-SQL
      UPDATE users SET role = 'admin' WHERE role = 'organization_admin'
    SQL

    # super_admin, group_admin, viewer を staff に変更
    execute <<-SQL
      UPDATE users SET role = 'staff' WHERE role IN ('super_admin', 'group_admin', 'viewer')
    SQL
  end
end
