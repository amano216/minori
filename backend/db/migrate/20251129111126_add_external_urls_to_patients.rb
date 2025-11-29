class AddExternalUrlsToPatients < ActiveRecord::Migration[8.1]
  def change
    add_column :patients, :external_urls, :jsonb, default: []
  end
end
