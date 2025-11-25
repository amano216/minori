#!/usr/bin/env ruby
# frozen_string_literal: true

# スタッフの重複チェック
staff_conflicts = []
Visit.where.not(status: ['cancelled', 'completed']).where.not(staff_id: nil).each do |visit|
  conflicting = Visit.where(staff_id: visit.staff_id)
    .where.not(id: visit.id)
    .where.not(status: ['cancelled', 'completed'])
    .where('scheduled_at < ? AND scheduled_at + (duration * interval \'1 minute\') > ?', 
           visit.scheduled_at + visit.duration.minutes, visit.scheduled_at)
  
  if conflicting.exists?
    staff_conflicts << {
      visit_id: visit.id, 
      staff_id: visit.staff_id, 
      patient_name: visit.patient.name,
      time: visit.scheduled_at.strftime('%Y-%m-%d %H:%M'),
      duration: visit.duration
    }
  end
end

# 患者の重複チェック
patient_conflicts = []
Visit.where.not(status: ['cancelled', 'completed']).each do |visit|
  conflicting = Visit.where(patient_id: visit.patient_id)
    .where.not(id: visit.id)
    .where.not(status: ['cancelled', 'completed'])
    .where('scheduled_at < ? AND scheduled_at + (duration * interval \'1 minute\') > ?', 
           visit.scheduled_at + visit.duration.minutes, visit.scheduled_at)
  
  if conflicting.exists?
    patient_conflicts << {
      visit_id: visit.id, 
      patient_id: visit.patient_id,
      patient_name: visit.patient.name,
      time: visit.scheduled_at.strftime('%Y-%m-%d %H:%M'),
      duration: visit.duration
    }
  end
end

puts "=== 重複チェック結果 ==="
puts "スタッフの重複: #{staff_conflicts.count}件"
puts "患者の重複: #{patient_conflicts.count}件"
puts ""

if staff_conflicts.any?
  puts "スタッフの重複詳細:"
  staff_conflicts.each do |conflict|
    puts "  - Visit #{conflict[:visit_id]}: Staff #{conflict[:staff_id]}, #{conflict[:patient_name]}, #{conflict[:time]}, #{conflict[:duration]}分"
  end
  puts ""
end

if patient_conflicts.any?
  puts "患者の重複詳細:"
  patient_conflicts.each do |conflict|
    puts "  - Visit #{conflict[:visit_id]}: #{conflict[:patient_name]}, #{conflict[:time]}, #{conflict[:duration]}分"
  end
end
