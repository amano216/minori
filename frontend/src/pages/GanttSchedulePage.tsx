import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  fetchGanttSchedule,
  fetchScheduleSummary,
  reassignVisit,
  type GanttSchedule,
  type GanttVisit,
  type ScheduleSummary,
} from '../api/client';
import { VisitModal } from '../components/VisitModal';

const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#cce5ff',
  in_progress: '#fff3cd',
  completed: '#d4edda',
  cancelled: '#f8d7da',
  unassigned: '#e2e3e5',
};

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function getVisitPosition(scheduledAt: string, duration: number) {
  const date = new Date(scheduledAt);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const startMinutes = (hours - 8) * 60 + minutes;
  const left = (startMinutes / 30) * 60; // 60px per 30min slot
  const width = (duration / 30) * 60;
  return { left: Math.max(0, left), width: Math.max(30, width) };
}

// Draggable Visit Bar Component
function VisitBar({
  visit,
  onClick,
  isDragging,
}: {
  visit: GanttVisit;
  onClick: () => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `visit-${visit.id}`,
    data: { visit },
  });

  const position = getVisitPosition(visit.scheduled_at, visit.duration);
  const style: React.CSSProperties = {
    position: 'absolute',
    left: position.left,
    width: position.width,
    top: 4,
    bottom: 4,
    backgroundColor: STATUS_COLORS[visit.status] || STATUS_COLORS.scheduled,
    borderRadius: 4,
    padding: '2px 6px',
    fontSize: '0.75rem',
    cursor: 'grab',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    opacity: isDragging ? 0.5 : 1,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    zIndex: isDragging ? 100 : 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`${visit.patient.name} - ${formatTime(visit.scheduled_at)} (${visit.duration}分)`}
    >
      <strong>{formatTime(visit.scheduled_at)}</strong> {visit.patient.name}
    </div>
  );
}

// Droppable Staff Row Component
function StaffRow({
  staffId,
  staffName,
  visits,
  onVisitClick,
  onEmptyClick,
  activeId,
}: {
  staffId: number | null;
  staffName: string;
  visits: GanttVisit[];
  onVisitClick: (visit: GanttVisit) => void;
  onEmptyClick: (staffId: number | null, time: string) => void;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: staffId !== null ? `staff-${staffId}` : 'unassigned',
    data: { staffId },
  });

  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 120; // Subtract staff name column width
    const slotIndex = Math.floor(x / 60);
    if (slotIndex >= 0 && slotIndex < TIME_SLOTS.length) {
      onEmptyClick(staffId, TIME_SLOTS[slotIndex]);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`gantt-row ${isOver ? 'gantt-row-over' : ''}`}
      onClick={handleRowClick}
    >
      <div className="gantt-staff-name">{staffName}</div>
      <div className="gantt-timeline">
        {TIME_SLOTS.map((time) => (
          <div key={time} className="gantt-cell" />
        ))}
        {visits.map((visit) => (
          <VisitBar
            key={visit.id}
            visit={visit}
            onClick={() => onVisitClick(visit)}
            isDragging={activeId === `visit-${visit.id}`}
          />
        ))}
      </div>
    </div>
  );
}

export function GanttSchedulePage() {
  const [schedule, setSchedule] = useState<GanttSchedule | null>(null);
  const [summary, setSummary] = useState<ScheduleSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<GanttVisit | null>(null);
  const [defaultStaffId, setDefaultStaffId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [ganttData, summaryData] = await Promise.all([
        fetchGanttSchedule({ date: selectedDate }),
        fetchScheduleSummary({ start_date: selectedDate, end_date: selectedDate }),
      ]);
      setSchedule(ganttData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const visitData = active.data.current?.visit as GanttVisit;
    const targetData = over.data.current as { staffId: number | null };

    if (!visitData || targetData.staffId === visitData.staff_id) return;

    try {
      await reassignVisit(visitData.id, targetData.staffId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スタッフの変更に失敗しました');
    }
  };

  const handleVisitClick = (visit: GanttVisit) => {
    setEditingVisit(visit);
    setDefaultStaffId(null);
    setModalOpen(true);
  };

  const handleEmptyClick = (staffId: number | null, _time: string) => {
    setEditingVisit(null);
    setDefaultStaffId(staffId);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    loadData();
  };

  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}月${date.getDate()}日(${days[date.getDay()]})`;
  };

  if (loading && !schedule) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="gantt-page">
      <div className="page-header">
        <h1>スケジュール</h1>
        <div className="header-actions">
          <Link to="/schedule" className="btn">
            週間表示
          </Link>
          <button className="btn btn-primary" onClick={() => { setEditingVisit(null); setDefaultStaffId(null); setModalOpen(true); }}>
            新規訪問
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-value">{summary.total_visits}</div>
            <div className="summary-label">総訪問数</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.by_status.scheduled}</div>
            <div className="summary-label">予定</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.by_status.completed}</div>
            <div className="summary-label">完了</div>
          </div>
          <div className="summary-card warning">
            <div className="summary-value">{summary.unassigned_visits}</div>
            <div className="summary-label">未割当</div>
          </div>
        </div>
      )}

      {/* Date Navigation */}
      <div className="schedule-controls">
        <div className="week-nav">
          <button onClick={goToPreviousDay} className="btn btn-small">
            &lt; 前日
          </button>
          <button onClick={goToToday} className="btn btn-small">
            今日
          </button>
          <button onClick={goToNextDay} className="btn btn-small">
            翌日 &gt;
          </button>
        </div>
        <div className="week-display">{formatDisplayDate(selectedDate)}</div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="filter-input"
        />
      </div>

      {/* Gantt Chart */}
      {schedule && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="gantt-container">
            {/* Time Header */}
            <div className="gantt-header">
              <div className="gantt-staff-name">スタッフ</div>
              <div className="gantt-timeline">
                {TIME_SLOTS.map((time) => (
                  <div key={time} className="gantt-time-header">
                    {time}
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Rows */}
            {schedule.staff_rows.map((row) => (
              <StaffRow
                key={row.staff.id}
                staffId={row.staff.id}
                staffName={row.staff.name}
                visits={row.visits}
                onVisitClick={handleVisitClick}
                onEmptyClick={handleEmptyClick}
                activeId={activeId}
              />
            ))}

            {/* Unassigned Row */}
            {schedule.unassigned_visits.length > 0 && (
              <StaffRow
                staffId={null}
                staffName="未割当"
                visits={schedule.unassigned_visits}
                onVisitClick={handleVisitClick}
                onEmptyClick={handleEmptyClick}
                activeId={activeId}
              />
            )}
          </div>

          <DragOverlay>
            {activeId && schedule && (
              <div
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#646cff',
                  color: 'white',
                  borderRadius: 4,
                  fontSize: '0.8rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                移動中...
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <div className="gantt-legend">
        <span className="legend-item"><span className="legend-color" style={{ background: STATUS_COLORS.scheduled }}></span> 予定</span>
        <span className="legend-item"><span className="legend-color" style={{ background: STATUS_COLORS.in_progress }}></span> 進行中</span>
        <span className="legend-item"><span className="legend-color" style={{ background: STATUS_COLORS.completed }}></span> 完了</span>
        <span className="legend-item"><span className="legend-color" style={{ background: STATUS_COLORS.unassigned }}></span> 未割当</span>
      </div>

      <div className="back-link">
        <Link to="/">ダッシュボードへ</Link>
      </div>

      <VisitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
        visit={editingVisit}
        defaultDate={selectedDate}
        defaultStaffId={defaultStaffId}
      />
    </div>
  );
}
