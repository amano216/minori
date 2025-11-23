class CreatePatients < ActiveRecord::Migration[8.1]
  def change
    create_table :patients do |t|
      t.string :name, null: false
      t.string :address
      t.string :phone
      t.jsonb :care_requirements, default: []
      t.text :notes
      t.string :status, default: "active", null: false

      t.timestamps
    end

    add_index :patients, :status
  end
end
