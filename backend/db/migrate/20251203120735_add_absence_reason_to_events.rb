class AddAbsenceReasonToEvents < ActiveRecord::Migration[8.1]
  def change
    add_column :events, :absence_reason, :string
  end
end
