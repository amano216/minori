Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes
  namespace :api do
    get "health", to: "health#show"

    # Auth routes
    post "auth/signup", to: "auth#signup"
    post "auth/login", to: "auth#login"
    delete "auth/logout", to: "auth#logout"
    get "auth/me", to: "auth#me"

    # Email confirmation
    post "auth/confirm-email", to: "auth#confirm_email"
    post "auth/resend-confirmation", to: "auth#resend_confirmation"

    # Password reset
    post "auth/forgot-password", to: "auth#forgot_password"
    post "auth/reset-password", to: "auth#reset_password"

    # OTP / 2FA
    post "auth/verify-otp", to: "auth#verify_otp"
    post "auth/toggle-2fa", to: "auth#toggle_2fa"

    # Staff routes
    resources :staffs

    # Patient routes
    resources :patients

    # Group routes (read-only for general users)
    resources :groups, only: [ :index ]

    # Visit routes
    resources :visits do
      member do
        patch :cancel
        patch :complete
      end
    end

    # Planning Lane routes
    resources :planning_lanes

    # Schedule routes
    get "schedules/daily", to: "schedules#daily"
    get "schedules/weekly", to: "schedules#weekly"
    get "schedules/gantt", to: "schedules#gantt"
    get "schedules/staff/:id", to: "schedules#staff"
    get "schedules/summary", to: "schedules#summary"

    # Organization routes
    resource :organization, only: [ :show, :update ]

    # Admin routes
    namespace :admin do
      resources :users
      resources :groups do
        member do
          post "members", to: "group_memberships#create"
          delete "members/:user_id", to: "group_memberships#destroy"
        end
      end
    end
  end
end
