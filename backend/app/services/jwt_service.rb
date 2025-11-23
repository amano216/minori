class JwtService
  SECRET_KEY = Rails.application.credentials.secret_key_base || ENV.fetch("SECRET_KEY_BASE", "development_secret")
  ALGORITHM = "HS256"
  EXPIRATION_TIME = 24.hours

  class << self
    def encode(payload)
      payload[:exp] = EXPIRATION_TIME.from_now.to_i
      payload[:iat] = Time.current.to_i
      JWT.encode(payload, SECRET_KEY, ALGORITHM)
    end

    def decode(token)
      decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: ALGORITHM })
      HashWithIndifferentAccess.new(decoded.first)
    rescue JWT::ExpiredSignature
      raise JwtService::ExpiredTokenError, "Token has expired"
    rescue JWT::DecodeError => e
      raise JwtService::InvalidTokenError, "Invalid token: #{e.message}"
    end
  end

  class ExpiredTokenError < StandardError; end
  class InvalidTokenError < StandardError; end
end
