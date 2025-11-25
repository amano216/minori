# frozen_string_literal: true

class DropRolesAndUserRoles < ActiveRecord::Migration[8.1]
  def up
    # 外部キー制約を先に削除
    remove_foreign_key :user_roles, :users, if_exists: true
    remove_foreign_key :user_roles, :roles, if_exists: true
    remove_foreign_key :user_roles, :organizations, if_exists: true
    remove_foreign_key :user_roles, :groups, if_exists: true

    # user_roles テーブルを削除
    drop_table :user_roles, if_exists: true

    # roles テーブルを削除
    drop_table :roles, if_exists: true
  end

  def down
    # roles テーブルを再作成
    create_table :roles do |t|
      t.string :name
      t.text :description
      t.timestamps
    end

    # user_roles テーブルを再作成
    create_table :user_roles do |t|
      t.references :user, null: false, foreign_key: true
      t.references :role, null: false, foreign_key: true
      t.references :organization, foreign_key: true
      t.references :group, foreign_key: true
      t.timestamps
    end

    add_index :user_roles, [ :user_id, :role_id, :organization_id ], unique: true, name: "idx_user_role_org"
  end
end
