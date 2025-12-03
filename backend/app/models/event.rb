# frozen_string_literal: true

class Event < ApplicationRecord
  # 3省2ガイドライン準拠の監査ログ（Phase 2）
  has_paper_trail

  EVENT_TYPES = %w[meeting facility training other absence].freeze
  ABSENCE_REASONS = %w[compensatory_leave paid_leave half_day_leave].freeze

  belongs_to :organization
  belongs_to :planning_lane, optional: true

  has_many :event_participants, dependent: :destroy
  has_many :staffs, through: :event_participants

  validates :title, presence: true
  validates :scheduled_at, presence: true
  validates :duration, presence: true, numericality: { greater_than: 0 }
  validates :event_type, inclusion: { in: EVENT_TYPES }
  validates :absence_reason, inclusion: { in: ABSENCE_REASONS }, if: -> { event_type == 'absence' }
  validates :absence_reason, absence: true, unless: -> { event_type == 'absence' }

  scope :for_organization, ->(org) { where(organization: org) }
  scope :on_date, ->(date) {
    where(scheduled_at: date.beginning_of_day..date.end_of_day)
  }
  scope :in_range, ->(start_date, end_date) {
    where(scheduled_at: start_date.beginning_of_day..end_date.end_of_day)
  }
  scope :for_staff, ->(staff_id) {
    joins(:event_participants).where(event_participants: { staff_id: staff_id })
  }
  scope :for_planning_lane, ->(lane_id) {
    where(planning_lane_id: lane_id)
  }

  def end_time
    scheduled_at + duration.minutes
  end

  def participant_ids
    event_participants.pluck(:staff_id)
  end

  def participant_ids=(ids)
    # 既存の参加者を削除して新しい参加者を設定
    event_participants.destroy_all
    ids.compact.uniq.each do |staff_id|
      event_participants.build(staff_id: staff_id)
    end
  end
end
