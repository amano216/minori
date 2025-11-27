#!/usr/bin/env ruby
# Script to import patients from CSV in production
# Usage: bin/rails runner script/import_patients.rb

require 'csv'

ORGANIZATION_ID = ENV['ORGANIZATION_ID']&.to_i
CSV_PATH = ENV['CSV_PATH'] || '/tmp/patients.csv'

unless ORGANIZATION_ID && ORGANIZATION_ID > 0
  puts "Error: ORGANIZATION_ID environment variable is required"
  exit 1
end

unless File.exist?(CSV_PATH)
  puts "Error: CSV file not found at #{CSV_PATH}"
  exit 1
end

# Japanese era to Western calendar conversion
def convert_japanese_date(date_str)
  return nil if date_str.nil? || date_str.strip.empty?
  
  date_str = date_str.strip
  
  # Handle Japanese era formats: T, S, H, R
  era_mapping = {
    'T' => 1911,  # Taisho: T1 = 1912
    'S' => 1925,  # Showa: S1 = 1926
    'H' => 1988,  # Heisei: H1 = 1989
    'R' => 2018   # Reiwa: R1 = 2019
  }
  
  if date_str =~ /^([TSHR])(\d{1,2})\.(\d{1,2})\.(\d{1,2})$/
    era = $1
    year = $2.to_i
    month = $3.to_i
    day = $4.to_i
    
    western_year = era_mapping[era] + year
    return Date.new(western_year, month, day)
  end
  
  # Try standard date formats
  begin
    Date.parse(date_str)
  rescue ArgumentError
    nil
  end
end

organization = Organization.find(ORGANIZATION_ID)
puts "Importing patients to organization: #{organization.name} (ID: #{ORGANIZATION_ID})"
puts "CSV file: #{CSV_PATH}"
puts "=" * 60

imported_count = 0
error_count = 0
errors = []

CSV.foreach(CSV_PATH, headers: true) do |row|
  begin
    # Build full address
    address_parts = [
      row['郵便番号'],
      row['住所1'],
      row['住所2']
    ].compact.reject(&:empty?)
    full_address = address_parts.join(' ')
    
    patient = Patient.new(
      name: row['氏名'],
      name_kana: row['氏名カナ'],
      date_of_birth: convert_japanese_date(row['生年月日']),
      gender: row['性別'],
      address: full_address,
      phone: row['電話番号'],
      care_level: row['要介護度'],
      care_requirements: row['注意事項'] || '',
      status: 'active',
      organization_id: ORGANIZATION_ID
    )
    
    if patient.save
      imported_count += 1
    else
      error_count += 1
      errors << "Row #{imported_count + error_count}: #{row['氏名']} - #{patient.errors.full_messages.join(', ')}"
    end
  rescue => e
    error_count += 1
    errors << "Row #{imported_count + error_count}: #{e.message}"
  end
end

puts "=" * 60
puts "Import completed!"
puts "Successfully imported: #{imported_count} patients"
puts "Errors: #{error_count}"

if errors.any?
  puts "\nError details:"
  errors.first(10).each { |e| puts "  - #{e}" }
  puts "  ... and #{errors.size - 10} more" if errors.size > 10
end

# Verify import
total_in_org = Patient.where(organization_id: ORGANIZATION_ID).count
puts "\nTotal patients in organization #{organization.name}: #{total_in_org}"
