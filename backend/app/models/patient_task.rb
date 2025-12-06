# frozen_string_literal: true

class PatientTask < ApplicationRecord
  # 3省2ガイドライン準拠の監査ログ
  has_paper_trail

  TASK_TYPES = %w[directive_change medication care_plan handover other].freeze
  STATUSES = %w[open done].freeze

  belongs_to :patient
  belongs_to :organization
  belongs_to :created_by, class_name: "User"
  belongs_to :completed_by, class_name: "User", optional: true
  has_many :patient_task_reads, dependent: :destroy

  validates :title, presence: true
  validates :task_type, presence: true, inclusion: { in: TASK_TYPES }
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :open_tasks, -> { where(status: "open") }
  scope :done_tasks, -> { where(status: "done") }
  scope :by_due_date, -> { order(Arel.sql("due_date IS NULL, due_date ASC")) }
  scope :by_created_at_desc, -> { order(created_at: :desc) }

  def complete!(user)
    update!(status: "done", completed_at: Time.current, completed_by: user)
  end

  def reopen!
    update!(status: "open", completed_at: nil, completed_by: nil)
  end

  def read_by?(user)
    patient_task_reads.exists?(user_id: user.id)
  end

  def mark_read!(user)
    patient_task_reads.find_or_create_by!(user: user)
  end

  def read_count
    patient_task_reads.count
  end

  def as_json(options = {})
    result = super(options)
    result["created_by"] = created_by.as_json(only: %i[id name]) if created_by
    result["completed_by"] = completed_by.as_json(only: %i[id name]) if completed_by
    result["patient"] = patient.as_json(only: %i[id name]) if patient
    if patient&.group
      result["patient"]["group"] = patient.group.as_json(only: %i[id name])
    end
    result["read_count"] = read_count
    result
  end
end
