class AddAuthenticationFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :email_confirmed_at, :datetime
    add_column :users, :confirmation_token, :string
    add_index :users, :confirmation_token
    add_column :users, :reset_password_token, :string
    add_index :users, :reset_password_token
    add_column :users, :reset_password_sent_at, :datetime
    add_column :users, :otp_secret, :string
    add_column :users, :otp_enabled, :boolean, default: false
    add_column :users, :last_otp_at, :datetime
  end
end
