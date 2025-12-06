# frozen_string_literal: true

module Api
  class PatientTasksController < ApplicationController
    before_action :authenticate_user!
    before_action :set_patient_task, only: %i[show update destroy mark_read complete]

    # GET /api/patient_tasks
    # GET /api/patients/:patient_id/tasks
    def index
      tasks = current_organization.patient_tasks
        .includes(:patient, :created_by, :completed_by, :patient_task_reads, patient: :group)

      # フィルタ
      tasks = tasks.where(patient_id: params[:patient_id]) if params[:patient_id].present?
      tasks = filter_by_status(tasks)
      tasks = filter_by_unread(tasks) if params[:unread_only] == "true"
      tasks = tasks.where(task_type: params[:task_type]) if params[:task_type].present?

      # ソート
      tasks = apply_sort(tasks)

      # グルーピング情報を含めてレスポンス
      render json: {
        tasks: tasks.map { |task| task_json(task) },
        meta: {
          total: tasks.size,
          unread_count: count_unread(tasks)
        }
      }
    end

    # GET /api/patient_tasks/:id
    def show
      render json: task_json(@patient_task)
    end

    # POST /api/patients/:patient_id/tasks
    def create
      patient = current_organization.patients.find(params[:patient_id])
      task = patient.patient_tasks.build(task_params)
      task.organization = current_organization
      task.created_by = current_user

      if task.save
        render json: task_json(task), status: :created
      else
        render json: { errors: task.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # PATCH /api/patient_tasks/:id
    def update
      if @patient_task.update(task_params)
        render json: task_json(@patient_task)
      else
        render json: { errors: @patient_task.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/patient_tasks/:id
    def destroy
      @patient_task.destroy
      head :no_content
    end

    # POST /api/patient_tasks/:id/mark_read
    def mark_read
      @patient_task.mark_read!(current_user)
      render json: task_json(@patient_task)
    end

    # POST /api/patient_tasks/:id/complete
    def complete
      @patient_task.complete!(current_user)
      render json: task_json(@patient_task)
    end

    private

    def set_patient_task
      @patient_task = current_organization.patient_tasks.find(params[:id])
    end

    def task_params
      params.require(:patient_task).permit(:title, :content, :task_type, :due_date, :status)
    end

    def filter_by_status(tasks)
      case params[:status]
      when "open"
        tasks.open_tasks
      when "done"
        tasks.done_tasks
      else
        tasks
      end
    end

    def filter_by_unread(tasks)
      read_task_ids = PatientTaskRead.where(user_id: current_user.id).pluck(:patient_task_id)
      tasks.where.not(id: read_task_ids)
    end

    def apply_sort(tasks)
      case params[:sort]
      when "created_at"
        direction = params[:sort_dir] == "asc" ? :asc : :desc
        tasks.order(created_at: direction)
      when "due_date"
        if params[:sort_dir] == "desc"
          tasks.order(Arel.sql("due_date IS NOT NULL, due_date DESC"))
        else
          tasks.order(Arel.sql("due_date IS NULL, due_date ASC"))
        end
      else
        # デフォルト: open優先、期限近い順、作成日新しい順
        tasks.order(
          Arel.sql("CASE WHEN status = 'open' THEN 0 ELSE 1 END"),
          Arel.sql("due_date IS NULL, due_date ASC"),
          created_at: :desc
        )
      end
    end

    def count_unread(tasks)
      read_task_ids = PatientTaskRead.where(user_id: current_user.id).pluck(:patient_task_id)
      tasks.where.not(id: read_task_ids).count
    end

    def task_json(task)
      total_staff = current_organization.users.where(staff_status: "active").count

      {
        id: task.id,
        title: task.title,
        content: task.content,
        task_type: task.task_type,
        status: task.status,
        due_date: task.due_date,
        created_at: task.created_at,
        updated_at: task.updated_at,
        completed_at: task.completed_at,
        created_by: task.created_by&.as_json(only: %i[id name]),
        completed_by: task.completed_by&.as_json(only: %i[id name]),
        patient: {
          id: task.patient.id,
          name: task.patient.name,
          group: task.patient.group&.as_json(only: %i[id name])
        },
        read_by_current_user: task.read_by?(current_user),
        read_count: task.read_count,
        total_staff_count: total_staff
      }
    end
  end
end
