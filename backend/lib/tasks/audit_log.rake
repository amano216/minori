# frozen_string_literal: true

# 3省2ガイドライン準拠の監査ログクリーンアップタスク
# 厚生労働省「医療情報システムの安全管理に関するガイドライン第6.0版」
# に基づき、5年間の保存期間を超えた監査ログを削除

namespace :audit_log do
  desc "Delete audit log records older than 5 years"
  task cleanup: :environment do
    retention_period = 5.years.ago
    target_count = PaperTrail::Version.where("created_at < ?", retention_period).count

    if target_count.zero?
      puts "No audit log records to delete (retention period: 5 years)"
      Rails.logger.info "[AuditLog] Cleanup: No records to delete"
      next
    end

    puts "Deleting #{target_count} audit log records older than #{retention_period.to_date}"
    Rails.logger.info "[AuditLog] Cleanup: Deleting #{target_count} records older than #{retention_period.to_date}"

    # バッチ削除（1000件ずつ）
    deleted_total = 0
    loop do
      deleted = PaperTrail::Version
                .where("created_at < ?", retention_period)
                .limit(1000)
                .delete_all

      deleted_total += deleted
      break if deleted.zero?

      puts "  Deleted #{deleted_total}/#{target_count} records..."
    end

    puts "Cleanup completed: #{deleted_total} records deleted"
    Rails.logger.info "[AuditLog] Cleanup completed: #{deleted_total} records deleted"
  end

  desc "Fix organization_id for existing versions records"
  task fix_organization_id: :environment do
    puts "=== Fixing organization_id for versions ==="

    null_count = PaperTrail::Version.where(organization_id: nil).count
    puts "Records with NULL organization_id: #{null_count}"

    if null_count.zero?
      puts "No records to fix."
      next
    end

    fixed = 0
    skipped = 0

    PaperTrail::Version.where(organization_id: nil).find_each do |version|
      begin
        klass = version.item_type.constantize
        record = klass.find_by(id: version.item_id)

        if record&.respond_to?(:organization_id) && record.organization_id
          version.update_columns(
            organization_id: record.organization_id,
            whodunnit_name: User.find_by(id: version.whodunnit)&.name,
            whodunnit_role: User.find_by(id: version.whodunnit)&.role
          )
          fixed += 1
        else
          skipped += 1
        end
      rescue => e
        puts "  Error processing version #{version.id}: #{e.message}"
        skipped += 1
      end
    end

    puts "Fixed: #{fixed}, Skipped: #{skipped}"
    puts "Done."
  end

  desc "Show audit log statistics"
  task stats: :environment do
    total = PaperTrail::Version.count
    by_type = PaperTrail::Version.group(:item_type).count
    by_event = PaperTrail::Version.group(:event).count
    oldest = PaperTrail::Version.minimum(:created_at)
    newest = PaperTrail::Version.maximum(:created_at)

    puts "=== Audit Log Statistics ==="
    puts "Total records: #{total}"
    puts ""
    puts "By type:"
    by_type.each { |type, count| puts "  #{type}: #{count}" }
    puts ""
    puts "By event:"
    by_event.each { |event, count| puts "  #{event}: #{count}" }
    puts ""
    puts "Date range: #{oldest&.to_date || 'N/A'} - #{newest&.to_date || 'N/A'}"
    puts ""

    # 5年以上経過したレコード数
    old_count = PaperTrail::Version.where("created_at < ?", 5.years.ago).count
    puts "Records older than 5 years: #{old_count}"
  end
end
