# frozen_string_literal: true

module Api
  class EventsController < ApplicationController
    before_action :set_organization
    before_action :set_event, only: [ :show, :update, :destroy ]

    # GET /api/events
    def index
      events = @organization.events.includes(:planning_lane, :event_participants)

      # 日付範囲でフィルタ
      if params[:start_date].present? && params[:end_date].present?
        start_date = Date.parse(params[:start_date])
        end_date = Date.parse(params[:end_date])
        events = events.in_range(start_date, end_date)
      elsif params[:date].present?
        date = Date.parse(params[:date])
        events = events.on_date(date)
      end

      # スタッフでフィルタ
      if params[:staff_id].present?
        events = events.for_staff(params[:staff_id])
      end

      # 計画レーンでフィルタ
      if params[:planning_lane_id].present?
        events = events.for_planning_lane(params[:planning_lane_id])
      end

      render json: events.map { |e| event_json(e) }
    end

    # GET /api/events/:id
    def show
      render json: event_json(@event)
    end

    # POST /api/events
    def create
      @event = @organization.events.build(event_params)

      if @event.save
        render json: event_json(@event), status: :created
      else
        render json: { errors: @event.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # PATCH/PUT /api/events/:id
    def update
      if @event.update(event_params)
        render json: event_json(@event)
      else
        render json: { errors: @event.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/events/:id
    def destroy
      @event.destroy
      head :no_content
    end

    private

    def set_organization
      @organization = Current.organization || Organization.first
    end

    def set_event
      @event = @organization.events.find(params[:id])
    end

    def event_params
      params.require(:event).permit(
        :title,
        :event_type,
        :scheduled_at,
        :duration,
        :notes,
        :planning_lane_id,
        participant_ids: []
      )
    end

    def event_json(event)
      {
        id: event.id,
        title: event.title,
        event_type: event.event_type,
        scheduled_at: event.scheduled_at.iso8601,
        duration: event.duration,
        notes: event.notes,
        planning_lane_id: event.planning_lane_id,
        planning_lane: event.planning_lane ? {
          id: event.planning_lane.id,
          name: event.planning_lane.name
        } : nil,
        participant_ids: event.participant_ids,
        participants: event.event_participants.includes(:staff).map do |ep|
          {
            id: ep.staff.id,
            name: ep.staff.name,
            status: ep.status
          }
        end,
        created_at: event.created_at.iso8601,
        updated_at: event.updated_at.iso8601
      }
    end
  end
end
