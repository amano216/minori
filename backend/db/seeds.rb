# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create default organization
puts "Creating default organization..."
default_org = Organization.find_or_create_by!(subdomain: "default") do |org|
  org.name = "デフォルト組織"
  org.plan = "free"
end

# Create default users for all environments
admin_user = User.find_or_create_by!(email: "admin@example.com") do |user|
  user.password = "password123"
  user.role = User::ORGANIZATION_ADMIN
  user.organization = default_org
  user.email_confirmed_at = Time.current
end

staff_user = User.find_or_create_by!(email: "staff@example.com") do |user|
  user.password = "password123"
  user.role = User::STAFF
  user.organization = default_org
  user.email_confirmed_at = Time.current
end

# Ensure existing users have correct roles
admin_user.update(role: User::ORGANIZATION_ADMIN) if admin_user.role == "admin"
staff_user.update(role: User::STAFF) if staff_user.role.blank?

# Ensure existing users are confirmed
[ admin_user, staff_user ].each do |user|
  user.update(email_confirmed_at: Time.current) if user.email_confirmed_at.nil?
end

# Create organization memberships
OrganizationMembership.find_or_create_by!(user: admin_user, organization: default_org)
OrganizationMembership.find_or_create_by!(user: staff_user, organization: default_org)

puts "Seed users created:"
puts "  - admin@example.com (password: password123, role: #{admin_user.role})"
puts "  - staff@example.com (password: password123, role: #{staff_user.role})"

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
    patient.organization_id = default_org.id
  end
end

# Update existing patients without organization
Patient.where(organization_id: nil).update_all(organization_id: default_org.id)

puts "Seed patients created: #{patients_data.size} patients"
