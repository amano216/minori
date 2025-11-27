# frozen_string_literal: true

module Api
  class GroupsController < ApplicationController
    # 一般ユーザー向けのグループ一覧取得（患者編集などで使用）
    def index
      @groups = if current_user.organization
                  current_user.organization.groups.order(:name)
      else
                  Group.none
      end

      render json: @groups.as_json(only: %i[id name group_type])
    end
  end
end
