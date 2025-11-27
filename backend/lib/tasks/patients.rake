# frozen_string_literal: true

require 'csv'

namespace :patients do
  desc "Import patients from CSV file"
  task import: :environment do
    # 和暦から西暦への変換メソッド
    def convert_japanese_date(date_str)
      return nil if date_str.blank?
      
      # 和暦のパターンマッチング (例: H29.08.01, R02.04.29, S15.04.21, T13.08.05)
      match = date_str.match(/^([HSRT])(\d{1,2})\.(\d{1,2})\.(\d{1,2})$/)
      return date_str unless match # マッチしない場合はそのまま返す
      
      era, year, month, day = match.captures
      
      # 元号から西暦への変換
      base_year = case era
                  when 'T' then 1911  # 大正 (1912-1926)
                  when 'S' then 1925  # 昭和 (1926-1989)
                  when 'H' then 1988  # 平成 (1989-2019)
                  when 'R' then 2018  # 令和 (2019-)
                  else return date_str
                  end
      
      western_year = base_year + year.to_i
      begin
        Date.new(western_year, month.to_i, day.to_i).strftime('%Y-%m-%d')
      rescue ArgumentError
        date_str # 無効な日付の場合は元の文字列を返す
      end
    end
    csv_path = ENV['CSV_PATH']
    organization_id = ENV['ORGANIZATION_ID']

    unless csv_path
      puts "Error: CSV_PATH environment variable is required"
      puts "Usage: CSV_PATH=/path/to/file.csv ORGANIZATION_ID=1 rails patients:import"
      exit 1
    end

    unless organization_id
      puts "Error: ORGANIZATION_ID environment variable is required"
      puts "Usage: CSV_PATH=/path/to/file.csv ORGANIZATION_ID=1 rails patients:import"
      exit 1
    end

    organization = Organization.find_by(id: organization_id)
    unless organization
      puts "Error: Organization with ID #{organization_id} not found"
      exit 1
    end

    unless File.exist?(csv_path)
      puts "Error: File not found: #{csv_path}"
      exit 1
    end

    puts "Importing patients from #{csv_path}"
    puts "Organization: #{organization.name} (ID: #{organization.id})"
    puts "=" * 80

    imported_count = 0
    skipped_count = 0
    error_count = 0

    CSV.foreach(csv_path, headers: true, encoding: 'UTF-8') do |row|
      # CSVの列マッピング
      patient_code = row['利用者ｺｰﾄﾞ']
      name = row['氏名']
      phone = row['電話番号']
      postal_code = row['郵便番号']
      address1 = row['住所1']
      address2 = row['住所2']
      start_date = row['基本情報 利用受付日']
      end_date = row['基本情報 利用終了日']
      location = row['基本情報 本体･ｻﾃﾗｲﾄ']

      # 和暦を西暦に変換
      start_date_western = convert_japanese_date(start_date)
      end_date_western = convert_japanese_date(end_date)

      # 住所を結合
      full_address = [postal_code, address1, address2].compact.join(' ')

      # 既に同じ名前と住所の患者が存在するかチェック
      existing_patient = organization.patients.find_by(name: name, address: full_address)
      if existing_patient
        puts "Skipped (already exists): #{name}"
        skipped_count += 1
        next
      end

      # ノートを作成（西暦と和暦の両方を記載）
      notes_parts = []
      notes_parts << "利用者コード: #{patient_code}" if patient_code.present?
      if start_date.present?
        notes_parts << "利用開始日: #{start_date_western} (#{start_date})"
      end
      if end_date.present?
        notes_parts << "利用終了日: #{end_date_western} (#{end_date})"
      end
      notes_parts << "拠点: #{location}" if location.present?

      # 患者を作成
      patient = Patient.new(
        name: name,
        phone: phone,
        address: full_address,
        notes: notes_parts.join("\n"),
        status: 'active',
        organization_id: organization.id
      )

      if patient.save
        puts "✓ Imported: #{name} (Code: #{patient_code})"
        imported_count += 1
      else
        puts "✗ Error importing #{name}: #{patient.errors.full_messages.join(', ')}"
        error_count += 1
      end
    rescue StandardError => e
      puts "✗ Error processing row: #{e.message}"
      error_count += 1
    end

    puts "=" * 80
    puts "Import completed!"
    puts "Imported: #{imported_count}"
    puts "Skipped: #{skipped_count}"
    puts "Errors: #{error_count}"
    puts "Total: #{imported_count + skipped_count + error_count}"
  end

  desc "List all patients"
  task list: :environment do
    organization_id = ENV['ORGANIZATION_ID']

    if organization_id
      organization = Organization.find_by(id: organization_id)
      unless organization
        puts "Error: Organization with ID #{organization_id} not found"
        exit 1
      end
      patients = organization.patients
      puts "Patients in #{organization.name}:"
    else
      patients = Patient.all
      puts "All patients:"
    end

    puts "=" * 80
    patients.order(:name).each do |patient|
      puts "#{patient.id}: #{patient.name} (#{patient.status})"
      puts "   Address: #{patient.address}" if patient.address.present?
      puts "   Phone: #{patient.phone}" if patient.phone.present?
      puts "   Organization: #{patient.organization&.name}"
      puts
    end
    puts "Total: #{patients.count} patients"
  end

  desc "Clear all patients"
  task clear: :environment do
    organization_id = ENV['ORGANIZATION_ID']

    if organization_id
      organization = Organization.find_by(id: organization_id)
      unless organization
        puts "Error: Organization with ID #{organization_id} not found"
        exit 1
      end

      count = organization.patients.count
      print "Are you sure you want to delete #{count} patients from #{organization.name}? (yes/no): "
      confirmation = STDIN.gets.chomp

      if confirmation.downcase == 'yes'
        organization.patients.destroy_all
        puts "Deleted #{count} patients from #{organization.name}"
      else
        puts "Cancelled"
      end
    else
      count = Patient.count
      print "Are you sure you want to delete ALL #{count} patients? (yes/no): "
      confirmation = STDIN.gets.chomp

      if confirmation.downcase == 'yes'
        Patient.destroy_all
        puts "Deleted all #{count} patients"
      else
        puts "Cancelled"
      end
    end
  end
end
