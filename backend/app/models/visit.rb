# frozen_string_literal: true

class Visit < ApplicationRecord
  STATUSES = %w[scheduled in_progress completed cancelled unassigned].freeze

  belongs_to :staff, optional: true
  belongs_to :patient
  belongs_to :planning_lane, optional: true

  validates :scheduled_at, presence: true
  validates :duration, presence: true, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }
  validate :staff_availability, if: -> { staff_id.present? && scheduled_at.present? }
  validate :patient_availability, if: -> { patient_id.present? && scheduled_at.present? }

  scope :scheduled, -> { where(status: "scheduled") }
  scope :in_progress, -> { where(status: "in_progress") }
  scope :completed, -> { where(status: "completed") }
  scope :cancelled, -> { where(status: "cancelled") }
  scope :unassigned, -> { where(status: "unassigned") }
  scope :for_staff, ->(staff_id) { where(staff_id: staff_id) }
  scope :for_patient, ->(patient_id) { where(patient_id: patient_id) }
  scope :on_date, ->(date) { where(scheduled_at: date.beginning_of_day..date.end_of_day) }
  scope :upcoming, -> { where("scheduled_at >= ?", Time.current).order(:scheduled_at) }

  def end_at
    scheduled_at + duration.minutes
  end

  def cancel!
    update!(status: "cancelled")
  end

  def complete!
    update!(status: "completed")
  end

  def start!
    update!(status: "in_progress")
  end

  def unassign!
    update!(staff_id: nil, status: "unassigned")
  end

  private

  def staff_availability
    return unless staff_id_changed? || scheduled_at_changed? || duration_changed?

    conflicting = Visit.where(staff_id: staff_id)
                       .where.not(id: id)
                       .where.not(status: %w[cancelled completed])
                       .where("scheduled_at < ? AND scheduled_at + (duration * interval '1 minute') > ?",
                              end_at, scheduled_at)

    errors.add(:base, "スタッフは既に別の訪問が予定されています") if conflicting.exists?
  end

  def patient_availability
    return unless patient_id_changed? || scheduled_at_changed? || duration_changed?

    conflicting = Visit.where(patient_id: patient_id)
                       .where.not(id: id)
                       .where.not(status: %w[cancelled completed])
                       .where("scheduled_at < ? AND scheduled_at + (duration * interval '1 minute') > ?",
                              end_at, scheduled_at)

    errors.add(:base, "患者は既に別の訪問が予定されています") if conflicting.exists?
  end
end
