class CreateGroups < ActiveRecord::Migration[8.1]
  def change
    create_table :groups do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :group_type, default: 0
      t.text :description

      t.timestamps
    end
  end
end
