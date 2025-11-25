class PlanningLane < ApplicationRecord
  belongs_to :organization
  has_many :visits, dependent: :nullify
end
