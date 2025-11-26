class ApplicationController < ActionController::API
  include ActionController::HttpAuthentication::Token::ControllerMethods

  before_action :authenticate_request

  attr_reader :current_user

  private

  def authenticate_request
    authenticate_with_http_token do |token, _options|
      begin
        payload = JwtService.decode(token)
        Rails.logger.info "🔐 Auth - Decoded payload: #{payload.inspect}"
        @current_user = User.find_by(id: payload[:user_id])
        Rails.logger.info "🔐 Auth - Found user: #{@current_user.inspect}"

        # Synchronization: Auth ←→ Organization
        if @current_user
          Current.user = @current_user
          Current.organization = @current_user.organization
          Rails.logger.info "🔐 Auth - Set organization: #{@current_user.organization&.name}"
        end
      rescue JwtService::ExpiredTokenError, JwtService::InvalidTokenError => e
        Rails.logger.error "🔐 Auth - Token error: #{e.class} - #{e.message}"
        @current_user = nil
      end
    end

    Rails.logger.info "🔐 Auth - Final current_user: #{@current_user.present? ? 'present' : 'nil'}"
    render_unauthorized unless @current_user
  end

  def render_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def skip_authentication
    @current_user = nil
  end
end
