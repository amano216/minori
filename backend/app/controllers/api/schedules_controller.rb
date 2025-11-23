# frozen_string_literal: true

module Api
  class SchedulesController < ApplicationController
    # authenticate_request is inherited from ApplicationController

    # GET /api/schedules/daily?date=2025-11-25
    def daily
      date = params[:date].present? ? Date.parse(params[:date]) : Date.current
      visits = Visit.includes(:staff, :patient)
                    .on_date(date)
                    .order(:scheduled_at)

      visits = visits.for_staff(params[:staff_id]) if params[:staff_id].present?

      render json: {
        date: date.to_s,
        visits: visits.as_json(include: {
          staff: { only: [ :id, :name ] },
          patient: { only: [ :id, :name, :address ] }
        })
      }
    end

    # GET /api/schedules/weekly?start_date=2025-11-24
    def weekly
      start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.current.beginning_of_week
      end_date = start_date + 6.days

      visits = Visit.includes(:staff, :patient)
                    .where(scheduled_at: start_date.beginning_of_day..end_date.end_of_day)
                    .order(:scheduled_at)

      visits = visits.for_staff(params[:staff_id]) if params[:staff_id].present?

      # Group visits by date
      visits_by_date = {}
      (start_date..end_date).each do |date|
        visits_by_date[date.to_s] = []
      end

      visits.each do |visit|
        date_key = visit.scheduled_at.to_date.to_s
        visits_by_date[date_key] << visit.as_json(include: {
          staff: { only: [ :id, :name ] },
          patient: { only: [ :id, :name, :address ] }
        })
      end

      render json: {
        start_date: start_date.to_s,
        end_date: end_date.to_s,
        days: visits_by_date
      }
    end

    # GET /api/schedules/staff/:id?start_date=2025-11-24&end_date=2025-11-30
    def staff
      staff = Staff.find(params[:id])
      start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.current
      end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : start_date + 6.days

      visits = staff.visits.includes(:patient)
                    .where(scheduled_at: start_date.beginning_of_day..end_date.end_of_day)
                    .order(:scheduled_at)

      render json: {
        staff: staff.as_json(only: [ :id, :name, :qualifications, :available_hours ]),
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
        unassigned_visits: visits.where(staff_id: nil).count
      }
    end
  end
end
