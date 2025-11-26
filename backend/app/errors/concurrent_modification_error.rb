# frozen_string_literal: true

class ConcurrentModificationError < StandardError
  def message
    "この訪問予定は他のユーザーによって更新されました。ページを再読み込みしてください。"
  end
end
