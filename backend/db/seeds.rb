# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create default users for all environments
User.find_or_create_by!(email: "admin@example.com") do |user|
  user.password = "password123"
  user.role = "admin"
end

User.find_or_create_by!(email: "staff@example.com") do |user|
  user.password = "password123"
  user.role = "staff"
end

puts "Seed users created:"
puts "  - admin@example.com (password: password123)"
puts "  - staff@example.com (password: password123)"

# Create sample patients
patients_data = [
  {
    name: "山田 太郎",
    address: "東京都渋谷区1-2-3",
    phone: "03-1234-5678",
    care_requirements: %w[nursing_care vital_check medication_management],
    notes: "週3回の訪問が必要",
    status: "active"
  },
  {
    name: "佐藤 花子",
    address: "東京都新宿区4-5-6",
    phone: "03-2345-6789",
    care_requirements: %w[rehabilitation bathing_assistance],
    notes: "リハビリ重点",
    status: "active"
  },
  {
    name: "鈴木 一郎",
    address: "東京都世田谷区7-8-9",
    phone: "03-3456-7890",
    care_requirements: %w[wound_care nursing_care],
    notes: "創傷ケアが必要",
    status: "active"
  }
]

patients_data.each do |patient_data|
  Patient.find_or_create_by!(name: patient_data[:name]) do |patient|
    patient.address = patient_data[:address]
    patient.phone = patient_data[:phone]
    patient.care_requirements = patient_data[:care_requirements]
    patient.notes = patient_data[:notes]
    patient.status = patient_data[:status]
  end
end

puts "Seed patients created: #{patients_data.size} patients"
