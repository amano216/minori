# frozen_string_literal: true

# 3省2ガイドライン準拠の監査ログクリーンアップジョブ
# 5年以上経過したログを削除
class AuditLogCleanupJob < ApplicationJob
  queue_as :default

  RETENTION_PERIOD = 5.years
  BATCH_SIZE = 1000

  def perform
    retention_date = RETENTION_PERIOD.ago
    target_count = PaperTrail::Version.where("created_at < ?", retention_date).count

    if target_count.zero?
      Rails.logger.info "[AuditLogCleanupJob] No records to delete (retention: #{RETENTION_PERIOD.inspect})"
      return
    end

    Rails.logger.info "[AuditLogCleanupJob] Starting cleanup: #{target_count} records older than #{retention_date.to_date}"

    deleted_total = 0
    loop do
      deleted = PaperTrail::Version
                .where("created_at < ?", retention_date)
                .limit(BATCH_SIZE)
                .delete_all

      deleted_total += deleted
      break if deleted.zero?

      Rails.logger.info "[AuditLogCleanupJob] Progress: #{deleted_total}/#{target_count} deleted"
      sleep(0.1) # DBへの負荷軽減
    end

    Rails.logger.info "[AuditLogCleanupJob] Completed: #{deleted_total} records deleted"
  end
end
