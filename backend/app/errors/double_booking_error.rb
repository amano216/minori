# frozen_string_literal: true

class DoubleBookingError < StandardError
  attr_reader :conflict_type, :resource_id

  def initialize(conflict_type:, resource_id:)
    @conflict_type = conflict_type
    @resource_id = resource_id
    super("Double booking detected for #{conflict_type}")
  end
end
