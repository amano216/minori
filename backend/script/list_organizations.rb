#!/usr/bin/env ruby
# Script to list all organizations in production database

puts "Organizations in production database:"
puts "=" * 50

Organization.all.each do |org|
  puts "ID: #{org.id}, Name: #{org.name}"
end

puts "=" * 50
puts "Total: #{Organization.count} organizations"
