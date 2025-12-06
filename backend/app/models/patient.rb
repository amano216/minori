# frozen_string_literal: true

class Patient < ApplicationRecord
  # 3省2ガイドライン準拠の監査ログ（Phase 1）
  has_paper_trail

  STATUSES = %w[active hospitalized inactive].freeze
  CARE_REQUIREMENTS = %w[
    nursing_care
    rehabilitation
    medication_management
    wound_care
    vital_check
    bathing_assistance
    meal_assistance
  ].freeze

  belongs_to :organization, optional: true
  belongs_to :group, optional: true
  has_many :visits, dependent: :destroy
  has_many :patient_tasks, dependent: :destroy
  has_many :visit_patterns, dependent: :destroy

  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }
  validate :validate_care_requirements
  validate :validate_phone_numbers
  validate :validate_external_urls

  scope :active, -> { where(status: "active") }
  scope :with_care_requirement, ->(req) { where("care_requirements @> ?", [ req ].to_json) }

  def active?
    status == "active"
  end

  def age
    return nil unless date_of_birth

    today = Date.current
    age = today.year - date_of_birth.year
    age -= 1 if today < date_of_birth + age.years
    age
  end

  def as_json(options = {})
    result = super(options.merge(methods: :age))
    if group
      result["group"] = group.as_json(only: %i[id name group_type])
    end
    result
  end

  # 指定ユーザーにとっての未読タスク数を返す
  def unread_task_count(user)
    patient_tasks.open_tasks
      .where.not(id: PatientTaskRead.where(user_id: user.id).select(:patient_task_id))
      .count
  end

  private

  def validate_care_requirements
    return if care_requirements.blank?

    invalid = care_requirements - CARE_REQUIREMENTS
    errors.add(:care_requirements, "contains invalid values: #{invalid.join(', ')}") if invalid.any?
  end

  def validate_phone_numbers
    return if phone_numbers.blank?

    phone_numbers.each_with_index do |phone, index|
      unless phone.is_a?(Hash) && phone["number"].present?
        errors.add(:phone_numbers, "電話番号#{index + 1}が無効です")
      end
    end
  end

  def validate_external_urls
    return if external_urls.blank?

    external_urls.each_with_index do |url_entry, index|
      unless url_entry.is_a?(Hash) && url_entry["url"].present?
        errors.add(:external_urls, "URL#{index + 1}が無効です")
      end
    end
  end
end
