# frozen_string_literal: true

class VisitPattern < ApplicationRecord
  belongs_to :planning_lane, optional: true
  belongs_to :patient
  belongs_to :organization
  belongs_to :default_staff, class_name: 'User', optional: true

  has_many :visits, dependent: :nullify

  validates :day_of_week, presence: true, inclusion: { in: 0..6 }
  validates :start_time, presence: true
  validates :duration, presence: true, numericality: { greater_than: 0 }

  # 曜日の名前を返す
  DAY_NAMES = %w[日 月 火 水 木 金 土].freeze

  def day_name
    DAY_NAMES[day_of_week]
  end

  # 指定した日付の訪問を生成
  def generate_visit_for_date(target_date)
    return nil unless target_date.wday == day_of_week

    Visit.new(
      patient: patient,
      user: default_staff,
      organization: organization,
      planning_lane: planning_lane,
      visit_pattern: self,
      scheduled_at: target_date.to_datetime.change(
        hour: start_time.hour,
        min: start_time.min
      ),
      duration: duration,
      status: default_staff ? 'scheduled' : 'unassigned'
    )
  end

  # 指定期間の訪問を一括生成
  def self.generate_visits_for_period(organization, start_date, end_date)
    patterns = where(organization: organization)
    generated = []

    (start_date..end_date).each do |date|
      patterns.where(day_of_week: date.wday).find_each do |pattern|
        # 既に同じパターンから生成された訪問がないかチェック
        existing = Visit.exists?(
          visit_pattern: pattern,
          scheduled_at: date.beginning_of_day..date.end_of_day
        )
        next if existing

        visit = pattern.generate_visit_for_date(date)
        if visit&.save
          generated << visit
        end
      end
    end

    generated
  end
end
