# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create default admin user for development
if Rails.env.development? || Rails.env.test?
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
end
