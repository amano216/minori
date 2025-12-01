# frozen_string_literal: true

class VisitPattern < ApplicationRecord
  # 3省2ガイドライン準拠の監査ログ（Phase 2）
  has_paper_trail

  belongs_to :planning_lane, optional: true
  belongs_to :patient
  belongs_to :organization
  belongs_to :default_staff, class_name: "User", optional: true

  has_many :visits, dependent: :nullify

  validates :day_of_week, presence: true, inclusion: { in: 0..6 }
  validates :start_time, presence: true
  validates :duration, presence: true, numericality: { greater_than: 0 }

  # "09:00" → DBに09:00:00として保存
  def start_time=(value)
    if value.is_a?(String) && value.match?(/\A\d{2}:\d{2}\z/)
      h, m = value.split(":").map(&:to_i)
      super(Time.utc(2000, 1, 1, h, m, 0))
    else
      super
    end
  end

  # DBの値をそのまま "09:00" 形式で返す
  def start_time_string
    start_time&.utc&.strftime("%H:%M")
  end

  # 曜日の名前を返す
  DAY_NAMES = %w[日 月 火 水 木 金 土].freeze

  def day_name
    DAY_NAMES[day_of_week]
  end

  # 指定した日付の訪問を生成
  def generate_visit_for_date(target_date)
    return nil unless target_date.wday == day_of_week

    h = start_time.utc.hour
    m = start_time.utc.min

    Visit.new(
      patient: patient,
      user: default_staff,
      organization: organization,
      planning_lane: planning_lane,
      visit_pattern: self,
      scheduled_at: Time.zone.local(target_date.year, target_date.month, target_date.day, h, m, 0),
      duration: duration,
      status: default_staff ? "scheduled" : "unassigned"
    )
  end

  # 指定期間の訪問を一括生成
  # day_of_weeks: 生成する曜日の配列（nilの場合は全曜日）
  def self.generate_visits_for_period(organization, start_date, end_date, day_of_weeks: nil)
    patterns = where(organization: organization)
    generated = []

    (start_date..end_date).each do |date|
      # 曜日フィルタが指定されている場合、その曜日のみ処理
      next if day_of_weeks.present? && !day_of_weeks.include?(date.wday)

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
