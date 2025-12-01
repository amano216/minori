class ApplicationController < ActionController::API
  include ActionController::HttpAuthentication::Token::ControllerMethods

  before_action :authenticate_request
  before_action :set_paper_trail_whodunnit

  attr_reader :current_user

  private

  def authenticate_request
    authenticate_with_http_token do |token, _options|
      begin
        payload = JwtService.decode(token)
        @current_user = User.find_by(id: payload[:user_id])

        # Synchronization: Auth ←→ Organization
        if @current_user
          Current.user = @current_user
          Current.organization = @current_user.organization
        end
      rescue JwtService::ExpiredTokenError, JwtService::InvalidTokenError => e
        Rails.logger.error "Authentication error: #{e.class} - #{e.message}"
        @current_user = nil
      end
    end

    render_unauthorized unless @current_user
  end

  def render_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def skip_authentication
    @current_user = nil
  end

  # paper_trail用：3省2ガイドライン準拠の監査ログ
  def user_for_paper_trail
    current_user&.id&.to_s
  end

  # paper_trail用：拡張メタデータ
  def info_for_paper_trail
    {
      whodunnit_name: current_user&.name,
      whodunnit_role: current_user&.role,
      organization_id: current_user&.organization_id,
      ip_address: request.remote_ip,
      user_agent: request.user_agent&.truncate(255)
    }
  end
end
