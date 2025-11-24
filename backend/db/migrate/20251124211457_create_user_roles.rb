class CreateUserRoles < ActiveRecord::Migration[8.1]
  def change
    create_table :user_roles do |t|
      t.references :user, null: false, foreign_key: true
      t.references :role, null: false, foreign_key: true
      t.references :organization, foreign_key: true
      t.references :group, foreign_key: true

      t.timestamps
    end
    add_index :user_roles, [ :user_id, :role_id, :organization_id ], unique: true, name: 'idx_user_role_org'
  end
end
