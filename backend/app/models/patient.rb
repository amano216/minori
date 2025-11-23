# frozen_string_literal: true

class Patient < ApplicationRecord
  STATUSES = %w[active inactive discharged].freeze
  CARE_REQUIREMENTS = %w[
    nursing_care
    rehabilitation
    medication_management
    wound_care
    vital_check
    bathing_assistance
    meal_assistance
  ].freeze

  has_many :visits, dependent: :destroy

  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :phone, format: { with: /\A[\d\-+() ]+\z/, allow_blank: true }
  validate :validate_care_requirements

  scope :active, -> { where(status: "active") }
  scope :with_care_requirement, ->(req) { where("care_requirements @> ?", [ req ].to_json) }

  def active?
    status == "active"
  end

  private

  def validate_care_requirements
    return if care_requirements.blank?

    invalid = care_requirements - CARE_REQUIREMENTS
    errors.add(:care_requirements, "contains invalid values: #{invalid.join(', ')}") if invalid.any?
  end
end
