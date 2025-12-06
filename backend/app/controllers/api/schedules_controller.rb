# frozen_string_literal: true

module Api
  class SchedulesController < ApplicationController
    # authenticate_request is inherited from ApplicationController

    # GET /api/schedules/daily?date=2025-11-25
    def daily
      date = params[:date].present? ? Date.parse(params[:date]) : Date.current
      visits = scoped_visits.includes(:user, patient: :group)
                    .on_date(date)
                    .order(:scheduled_at)

      visits = visits.for_user(params[:staff_id]) if params[:staff_id].present?

      # 未読タスク数をバッチ取得
      patient_ids = visits.map(&:patient_id).compact.uniq
      unread_counts = batch_unread_task_counts(patient_ids)

      render json: {
        date: date.to_s,
        visits: visits.map { |v| visit_with_staff_json(v, unread_counts) }
      }
    end

    # GET /api/schedules/weekly?start_date=2025-11-24
    def weekly
      start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.current.beginning_of_week
      end_date = start_date + 6.days

      visits = scoped_visits.includes(:user, patient: :group)
                    .where(scheduled_at: start_date.beginning_of_day..end_date.end_of_day)
                    .order(:scheduled_at)

      visits = visits.for_user(params[:staff_id]) if params[:staff_id].present?

      # 未読タスク数をバッチ取得
      patient_ids = visits.map(&:patient_id).compact.uniq
      unread_counts = batch_unread_task_counts(patient_ids)

      # Group visits by date
      visits_by_date = {}
      (start_date..end_date).each do |date|
        visits_by_date[date.to_s] = []
      end

      visits.each do |visit|
        date_key = visit.scheduled_at.to_date.to_s
        visits_by_date[date_key] << visit_with_staff_json(visit, unread_counts)
      end

      render json: {
        start_date: start_date.to_s,
        end_date: end_date.to_s,
        days: visits_by_date
      }
    end

    # GET /api/schedules/staff/:id?start_date=2025-11-24&end_date=2025-11-30
    def staff
      user = scoped_users.find(params[:id])
      start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.current
      end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : start_date + 6.days

      visits = user.visits.includes(:patient)
                    .where(organization_id: current_user.organization_id)
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

      visits = scoped_visits.where(scheduled_at: start_date.beginning_of_day..end_date.end_of_day)

      # 最適化: 1回のクエリで全ステータスの集計を取得
      status_counts = visits.group(:status).count

      render json: {
        start_date: start_date.to_s,
        end_date: end_date.to_s,
        total_visits: visits.count,
        by_status: {
          scheduled: status_counts["scheduled"] || 0,
          in_progress: status_counts["in_progress"] || 0,
          completed: status_counts["completed"] || 0,
          cancelled: status_counts["cancelled"] || 0,
          unassigned: status_counts["unassigned"] || 0
        },
        unassigned_visits: visits.where(user_id: nil).count
      }
    end

    # GET /api/schedules/gantt?date=2025-11-25
    # Returns data structured for gantt chart (staff rows with their visits)
    def gantt
      date = params[:date].present? ? Date.parse(params[:date]) : Date.current

      users = scoped_users.where(staff_status: "active").order(:name)
      visits = scoped_visits.includes(:user, :patient)
                    .on_date(date)
                    .where.not(status: "cancelled")
                    .order(:scheduled_at)

      # 未読タスク数をバッチ取得
      patient_ids = visits.map(&:patient_id).compact.uniq
      unread_counts = batch_unread_task_counts(patient_ids)

      # Group visits by user
      visits_by_user = visits.group_by(&:user_id)

      # Build staff rows with their visits
      staff_rows = users.map do |user|
        user_visits = visits_by_user[user.id] || []
        {
          staff: user.as_json(only: [ :id, :name, :staff_status ]),
          visits: user_visits.map { |v| visit_json(v, unread_counts) }
        }
      end

      # Unassigned visits
      unassigned_visits = visits_by_user[nil] || []

      render json: {
        date: date.to_s,
        staff_rows: staff_rows,
        unassigned_visits: unassigned_visits.map { |v| visit_json(v, unread_counts) }
      }
    end

    private

    def scoped_visits
      if current_user.organization_id
        Visit.where(organization_id: current_user.organization_id)
      else
        Visit.none
      end
    end

    def scoped_users
      if current_user.organization_id
        User.where(organization_id: current_user.organization_id)
      else
        User.none
      end
    end

    def visit_with_staff_json(visit, unread_counts = {})
      patient_json = visit.patient&.as_json(only: [ :id, :name, :address, :external_urls, :status ])
      if visit.patient&.group
        patient_json[:group] = { id: visit.patient.group.id, name: visit.patient.group.name }
      end
      if visit.patient
        patient_json[:unread_task_count] = unread_counts[visit.patient_id] || 0
      end
      {
        id: visit.id,
        scheduled_at: visit.scheduled_at,
        duration: visit.duration,
        status: visit.status,
        visit_type: visit.visit_type,
        notes: visit.notes,
        staff_id: visit.user_id,
        staff: visit.user&.as_json(only: [ :id, :name ]),
        patient: patient_json,
        planning_lane_id: visit.planning_lane_id
      }
    end

    def visit_json(visit, unread_counts = {})
      patient_json = visit.patient.as_json(only: [ :id, :name, :address, :external_urls, :status ])
      patient_json[:unread_task_count] = unread_counts[visit.patient_id] || 0
      {
        id: visit.id,
        scheduled_at: visit.scheduled_at,
        duration: visit.duration,
        status: visit.status,
        visit_type: visit.visit_type,
        notes: visit.notes,
        patient: patient_json,
        staff_id: visit.user_id,
        planning_lane_id: visit.planning_lane_id
      }
    end

    # 患者IDリストから未読タスク数をバッチ取得（N+1対策）
    def batch_unread_task_counts(patient_ids)
      return {} if patient_ids.blank?

      # 現在のユーザーが既読済みのタスクIDを取得
      read_task_ids = PatientTaskRead.where(user_id: current_user.id).pluck(:patient_task_id)

      # 未読のopenタスクを患者ごとにカウント
      PatientTask.where(patient_id: patient_ids, status: "open")
                 .where.not(id: read_task_ids)
                 .group(:patient_id)
                 .count
    end
  end
end
