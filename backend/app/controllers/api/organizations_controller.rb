module Api
  class OrganizationsController < ApplicationController
    before_action :set_organization, only: [ :show, :update ]
    before_action :authorize_organization_admin!, only: [ :update ]

    def show
      render json: @organization
    end

    def update
      if @organization.update(organization_params)
        render json: @organization
      else
        render json: { errors: @organization.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def set_organization
      @organization = current_user.organization
      render json: { error: "Organization not found" }, status: :not_found unless @organization
    end

    def organization_params
      params.require(:organization).permit(:name, :subdomain, :settings)
    end

    def authorize_organization_admin!
      unless current_user.has_role?("organization_admin") || current_user.has_role?("super_admin")
        render json: { error: "Unauthorized" }, status: :forbidden
      end
    end
  end
end
