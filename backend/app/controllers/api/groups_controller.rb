# frozen_string_literal: true

module Api
  class GroupsController < ApplicationController
    # 一般ユーザー向けのグループ一覧取得（患者編集などで使用）
    def index
      @groups = if current_user.organization
                  current_user.organization.groups.order(:position, :name)
      else
                  Group.none
      end

      render json: @groups.as_json(only: %i[id name group_type parent_id position])
    end

    # グループの並び順を更新
    # PATCH /api/groups/reorder
    # { group_ids: [5, 3, 1, 2] }
    def reorder
      group_ids = params[:group_ids]

      unless group_ids.is_a?(Array) && group_ids.present?
        return render json: { error: "group_ids must be a non-empty array" }, status: :bad_request
      end

      ActiveRecord::Base.transaction do
        group_ids.each_with_index do |group_id, index|
          group = current_user.organization.groups.find_by(id: group_id)
          group&.update!(position: index + 1)
        end
      end

      render json: { success: true }
    rescue ActiveRecord::RecordInvalid => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end
end
