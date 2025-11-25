class ApplicationController < ActionController::API
  include ActionController::HttpAuthentication::Token::ControllerMethods

  before_action :authenticate_request

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
      rescue JwtService::ExpiredTokenError, JwtService::InvalidTokenError
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
end
