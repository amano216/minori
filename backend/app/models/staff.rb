# frozen_string_literal: true

class Staff < ApplicationRecord
  STATUSES = %w[active inactive on_leave].freeze
  QUALIFICATIONS = %w[nurse physical_therapist occupational_therapist speech_therapist care_worker].freeze

  has_many :visits, dependent: :nullify

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, inclusion: { in: STATUSES }
  validate :validate_qualifications
  validate :validate_available_hours

  scope :active, -> { where(status: "active") }
  scope :with_qualification, ->(qual) { where("qualifications @> ?", [ qual ].to_json) }

  def active?
    status == "active"
  end

  private

  def validate_qualifications
    return if qualifications.blank?

    invalid = qualifications - QUALIFICATIONS
    errors.add(:qualifications, "contains invalid values: #{invalid.join(', ')}") if invalid.any?
  end

  def validate_available_hours
    return if available_hours.blank?

    valid_days = %w[monday tuesday wednesday thursday friday saturday sunday]
    invalid_days = available_hours.keys - valid_days
    errors.add(:available_hours, "contains invalid days: #{invalid_days.join(', ')}") if invalid_days.any?
  end
end
