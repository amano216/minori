class AddExtendedFieldsToPatients < ActiveRecord::Migration[8.1]
  def change
    add_column :patients, :postal_code, :string
    add_column :patients, :name_kana, :string
    add_column :patients, :date_of_birth, :date
    add_column :patients, :gender, :string
    add_column :patients, :patient_code, :string

    add_index :patients, :patient_code
  end
end
