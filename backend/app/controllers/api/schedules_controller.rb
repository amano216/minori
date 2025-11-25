# frozen_string_literal: true

module Api
  class SchedulesController < ApplicationController
    # authenticate_request is inherited from ApplicationController

    # GET /api/schedules/daily?date=2025-11-25
    def daily
      date = params[:date].present? ? Date.parse(params[:date]) : Date.current
      visits = Visit.includes(:user, :patient)
                    .on_date(date)
                    .order(:scheduled_at)

      visits = visits.for_user(params[:staff_id]) if params[:staff_id].present?

      render json: {
        date: date.to_s,
        visits: visits.map { |v| visit_with_staff_json(v) }
      }
    end

    # GET /api/schedules/weekly?start_date=2025-11-24
    def weekly
      start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.current.beginning_of_week
      end_date = start_date + 6.days

      visits = Visit.includes(:user, :patient)
                    .where(scheduled_at: start_date.beginning_of_day..end_date.end_of_day)
                    .order(:scheduled_at)

      visits = visits.for_user(params[:staff_id]) if params[:staff_id].present?

      # Group visits by date
      visits_by_date = {}
      (start_date..end_date).each do |date|
        visits_by_date[date.to_s] = []
      end

      visits.each do |visit|
        date_key = visit.scheduled_at.to_date.to_s
        visits_by_date[date_key] << visit_with_staff_json(visit)
      end

      render json: {
        start_date: start_date.to_s,
        end_date: end_date.to_s,
        days: visits_by_date
      }
    end

    # GET /api/schedules/staff/:id?start_date=2025-11-24&end_date=2025-11-30
    def staff
      user = User.find(params[:id])
      start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.current
      end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : start_date + 6.days

      visits = user.visits.includes(:patient)
                    .where(scheduled_at: start_date.beginning_of_day..end_date.end_of_day)
                    .order(:scheduled_at)

      render json: {
        staff: user.as_json(only: [ :id, :name, :qualifications, :available_hours ]),
        start_date: start_date.to_s,
        end_date: end_date.to_s,
        visits: visits.as_json(include: {
          patient: { only: [ :id, :name, :address ] }
        })
      }
    end

    # GET /api/schedules/summary?start_date=2025-11-24&end_date=2025-11-30
    def summary
      start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.current.beginning_of_week
      end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : start_date + 6.days

      visits = Visit.where(scheduled_at: start_date.beginning_of_day..end_date.end_of_day)

      render json: {
        start_date: start_date.to_s,
        end_date: end_date.to_s,
        total_visits: visits.count,
        by_status: {
          scheduled: visits.where(status: "scheduled").count,
          in_progress: visits.where(status: "in_progress").count,
          completed: visits.where(status: "completed").count,
          cancelled: visits.where(status: "cancelled").count,
          unassigned: visits.where(status: "unassigned").count
        },
        unassigned_visits: visits.where(user_id: nil).count
      }
    end

    # GET /api/schedules/gantt?date=2025-11-25
    # Returns data structured for gantt chart (staff rows with their visits)
    def gantt
      date = params[:date].present? ? Date.parse(params[:date]) : Date.current

      users = User.where(staff_status: "active").order(:name)
      visits = Visit.includes(:user, :patient)
                    .on_date(date)
                    .where.not(status: "cancelled")
                    .order(:scheduled_at)

      # Group visits by user
      visits_by_user = visits.group_by(&:user_id)

      # Build staff rows with their visits
      staff_rows = users.map do |user|
        user_visits = visits_by_user[user.id] || []
        {
          staff: user.as_json(only: [ :id, :name, :staff_status ]),
          visits: user_visits.map { |v| visit_json(v) }
        }
      end

      # Unassigned visits
      unassigned_visits = visits_by_user[nil] || []

      render json: {
        date: date.to_s,
        staff_rows: staff_rows,
        unassigned_visits: unassigned_visits.map { |v| visit_json(v) }
      }
    end

    private

    def visit_with_staff_json(visit)
      {
        id: visit.id,
        scheduled_at: visit.scheduled_at,
        duration: visit.duration,
        status: visit.status,
        notes: visit.notes,
        staff_id: visit.user_id,
        staff: visit.user&.as_json(only: [ :id, :name ]),
        patient: visit.patient&.as_json(only: [ :id, :name, :address ]),
        planning_lane_id: visit.planning_lane_id
      }
    end

    def visit_json(visit)
      {
        id: visit.id,
        scheduled_at: visit.scheduled_at,
        duration: visit.duration,
        status: visit.status,
        notes: visit.notes,
        patient: visit.patient.as_json(only: [ :id, :name, :address ]),
        staff_id: visit.user_id,
        planning_lane_id: visit.planning_lane_id
      }
    end
  end
end
