# frozen_string_literal: true

module Api
  class VersionsController < ApplicationController
    # 3省2ガイドライン準拠の監査ログAPI
    # 患者情報・訪問履歴のCRUD操作履歴を提供

    # GET /api/versions
    # パラメータ:
    #   - item_type: "Patient" or "Visit"
    #   - item_id: レコードID
    #   - page: ページ番号（デフォルト1）
    #   - per_page: 1ページあたりの件数（デフォルト20）
    def index
      versions = PaperTrail::Version
                 .where(organization_id: current_user.organization_id)
                 .order(created_at: :desc)

      versions = versions.where(item_type: params[:item_type]) if params[:item_type].present?
      versions = versions.where(item_id: params[:item_id]) if params[:item_id].present?

      # ページネーション
      page = (params[:page] || 1).to_i
      per_page = [ (params[:per_page] || 20).to_i, 100 ].min
      total_count = versions.count
      versions = versions.offset((page - 1) * per_page).limit(per_page)

      render json: {
        versions: versions.map { |v| version_json(v) },
        meta: {
          current_page: page,
          per_page: per_page,
          total_count: total_count,
          total_pages: (total_count.to_f / per_page).ceil
        }
      }
    end

    # GET /api/versions/:id
    def show
      version = PaperTrail::Version
                .where(organization_id: current_user.organization_id)
                .find(params[:id])

      render json: { version: version_json(version, include_diff: true) }
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Version not found" }, status: :not_found
    end

    private

    def version_json(version, include_diff: false)
      json = {
        id: version.id,
        item_type: version.item_type,
        item_id: version.item_id,
        event: version.event,
        event_label: event_label(version.event),
        whodunnit: version.whodunnit,
        whodunnit_name: version.whodunnit_name,
        whodunnit_role: version.whodunnit_role,
        ip_address: version.ip_address,
        created_at: version.created_at.iso8601
      }

      if include_diff
        json[:object] = version.object
        json[:object_changes] = format_changes(version.object_changes)
      end

      json
    end

    def event_label(event)
      case event
      when "create" then "作成"
      when "update" then "更新"
      when "destroy" then "削除"
      else event
      end
    end

    def format_changes(changes)
      return {} if changes.blank?

      changes.transform_values do |values|
        next values unless values.is_a?(Array) && values.length == 2

        {
          before: values[0],
          after: values[1]
        }
      end
    end
  end
end
