# frozen_string_literal: true

class EventParticipant < ApplicationRecord
  STATUSES = %w[confirmed tentative declined].freeze

  belongs_to :event
  belongs_to :staff, class_name: "User"

  validates :status, inclusion: { in: STATUSES }
  validates :staff_id, uniqueness: { scope: :event_id, message: "is already a participant" }
end
