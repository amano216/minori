# frozen_string_literal: true

class Visit < ApplicationRecord
  # 3省2ガイドライン準拠の監査ログ（Phase 1）
  has_paper_trail

  STATUSES = %w[scheduled in_progress completed cancelled unassigned].freeze

  # 患者重複チェックをスキップするためのフラグ（学生同行・複数名訪問用）
  attr_accessor :skip_patient_conflict_check

  belongs_to :user, optional: true
  belongs_to :patient
  belongs_to :planning_lane, optional: true
  belongs_to :organization, optional: true
  belongs_to :visit_pattern, optional: true

  validates :scheduled_at, presence: true
  validates :duration, presence: true, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }
  validate :user_availability, if: -> { user_id.present? && scheduled_at.present? }
  validate :patient_availability, if: -> { patient_id.present? && scheduled_at.present? && !skip_patient_conflict_check }

  # staff_id/user_idとstatusの整合性を自動で保証
  before_save :ensure_status_consistency

  def ensure_status_consistency
    # スタッフが割り当てられているのにunassignedの場合、scheduledに変更
    if user_id.present? && status == "unassigned"
      self.status = "scheduled"
    # スタッフが未割り当てでscheduledの場合、unassignedに変更
    elsif user_id.blank? && status == "scheduled"
      self.status = "unassigned"
    end
  end

  scope :scheduled, -> { where(status: "scheduled") }
  scope :in_progress, -> { where(status: "in_progress") }
  scope :completed, -> { where(status: "completed") }
  scope :cancelled, -> { where(status: "cancelled") }
  scope :unassigned, -> { where(status: "unassigned") }
  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :for_staff, ->(user_id) { where(user_id: user_id) } # エイリアス（後方互換性）
  scope :for_patient, ->(patient_id) { where(patient_id: patient_id) }
  scope :on_date, ->(date) { where(scheduled_at: date.beginning_of_day..date.end_of_day) }
  scope :upcoming, -> { where("scheduled_at >= ?", Time.current).order(:scheduled_at) }

  # 後方互換性のためのエイリアス（staff_idはuser_idのエイリアス）
  alias_attribute :staff_id, :user_id
  alias_method :staff, :user

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
    update!(user_id: nil, status: "unassigned")
  end

  private

  def user_availability
    return unless user_id_changed? || scheduled_at_changed? || duration_changed?

    conflicting = Visit.where(user_id: user_id)
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
