class AddFrequencyToVisitPatterns < ActiveRecord::Migration[8.1]
  def change
    add_column :visit_patterns, :frequency, :string, default: 'weekly', null: false
  end
end
