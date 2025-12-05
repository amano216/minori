class AddVisitTypeToVisits < ActiveRecord::Migration[8.1]
  def change
    add_column :visits, :visit_type, :string, default: 'planned', null: false
    add_index :visits, :visit_type
  end
end
