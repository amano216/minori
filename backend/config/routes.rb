Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes
  namespace :api do
    get "health", to: "health#show"

    # Auth routes
    post "auth/login", to: "auth#login"
    delete "auth/logout", to: "auth#logout"
    get "auth/me", to: "auth#me"

    # Staff routes
    resources :staffs

    # Patient routes
    resources :patients

    # Visit routes
    resources :visits do
      member do
        patch :cancel
        patch :complete
      end
    end

    # Schedule routes
    get "schedules/daily", to: "schedules#daily"
    get "schedules/weekly", to: "schedules#weekly"
    get "schedules/gantt", to: "schedules#gantt"
    get "schedules/staff/:id", to: "schedules#staff"
    get "schedules/summary", to: "schedules#summary"

    # Organization routes
    resource :organization, only: [:show, :update]

    # Admin routes
    namespace :admin do
      resources :users
      resources :roles
      resources :groups do
        member do
          post 'members', to: 'group_memberships#create'
          delete 'members/:user_id', to: 'group_memberships#destroy'
        end
      end
    end

    # User roles routes
    resources :users, only: [] do
      resources :roles, only: [:create, :destroy], controller: 'user_roles'
    end
  end
end
