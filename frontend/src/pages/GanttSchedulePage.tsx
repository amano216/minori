import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  cancelVisit,
  completeVisit,
  type GanttSchedule,
  type GanttVisit,
  type ScheduleSummary,
} from '../api/client';
import { VisitModal } from '../components/VisitModal';
import { ContextMenu, type ContextMenuItem } from '../components/ContextMenu';
import { Button } from '../components/atoms/Button';
import { Spinner } from '../components/atoms/Spinner';
import { Card } from '../components/molecules/Card';
import { PageHeader } from '../components/templates/ListLayout';

const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#e6f1f8',
  in_progress: '#fff4e5',
  completed: '#e3f5e8',
  cancelled: '#fce4ec',
  unassigned: '#f0efed',
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
  const left = (startMinutes / 30) * 60;
  const width = (duration / 30) * 60;
  return { left: Math.max(0, left), width: Math.max(30, width) };
}

function VisitBar({
  visit,
  onClick,
  onContextMenu,
  isDragging,
}: {
  visit: GanttVisit;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    borderLeft: '3px solid #0077c7',
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
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e);
      }}
      title={`${visit.patient.name} - ${formatTime(visit.scheduled_at)} (${visit.duration}分)`}
    >
      <strong>{formatTime(visit.scheduled_at)}</strong> {visit.patient.name}
    </div>
  );
}

function StaffRow({
  staffId,
  staffName,
  visits,
  onVisitClick,
  onVisitContextMenu,
  onEmptyClick,
  activeId,
}: {
  staffId: number | null;
  staffName: string;
  visits: GanttVisit[];
  onVisitClick: (visit: GanttVisit) => void;
  onVisitContextMenu: (visit: GanttVisit, e: React.MouseEvent) => void;
  onEmptyClick: (staffId: number | null, time: string) => void;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: staffId !== null ? `staff-${staffId}` : 'unassigned',
    data: { staffId },
  });

  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 120;
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
            onContextMenu={(e) => onVisitContextMenu(visit, e)}
            isDragging={activeId === `visit-${visit.id}`}
          />
        ))}
      </div>
    </div>
  );
}

export function GanttSchedulePage() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<GanttSchedule | null>(null);
  const [summary, setSummary] = useState<ScheduleSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<GanttVisit | null>(null);
  const [defaultStaffId, setDefaultStaffId] = useState<number | null>(null);
  const [defaultTime, setDefaultTime] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visit: GanttVisit;
  } | null>(null);

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

  const handleEmptyClick = (staffId: number | null, time: string) => {
    setEditingVisit(null);
    setDefaultStaffId(staffId);
    setDefaultTime(time);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    loadData();
  };

  const handleVisitContextMenu = (visit: GanttVisit, e: React.MouseEvent) => {
    setContextMenu({ x: e.clientX, y: e.clientY, visit });
  };

  const handleCancelVisit = async (visit: GanttVisit) => {
    try {
      await cancelVisit(visit.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'キャンセルに失敗しました');
    }
  };

  const handleCompleteVisit = async (visit: GanttVisit) => {
    try {
      await completeVisit(visit.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '完了処理に失敗しました');
    }
  };

  const getContextMenuItems = (visit: GanttVisit): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
      {
        label: '編集',
        onClick: () => {
          setEditingVisit(visit);
          setDefaultStaffId(null);
          setModalOpen(true);
        },
      },
    ];

    if (visit.status === 'scheduled') {
      items.push({
        label: '進行中にする',
        onClick: async () => {
          try {
            await reassignVisit(visit.id, visit.staff_id);
            await loadData();
          } catch (err) {
            setError(err instanceof Error ? err.message : '更新に失敗しました');
          }
        },
      });
    }

    if (visit.status !== 'completed' && visit.status !== 'cancelled') {
      items.push({
        label: '完了にする',
        onClick: () => handleCompleteVisit(visit),
      });
      items.push({
        label: 'キャンセル',
        onClick: () => handleCancelVisit(visit),
        danger: true,
      });
    }

    return items;
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
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="ガントチャート"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/schedule')}>
              週間表示
            </Button>
            <Button variant="primary" onClick={() => { setEditingVisit(null); setDefaultStaffId(null); setModalOpen(true); }}>
              新規訪問
            </Button>
          </div>
        }
      />

      {error && (
        <div className="bg-danger-100 border border-danger-300 text-danger rounded-md p-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-3xl font-bold text-text-black">{summary.total_visits}</div>
            <div className="text-sm text-text-grey">総訪問数</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-main">{summary.by_status.scheduled}</div>
            <div className="text-sm text-text-grey">予定</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-success">{summary.by_status.completed}</div>
            <div className="text-sm text-text-grey">完了</div>
          </Card>
          <Card className="text-center bg-warning-50">
            <div className="text-3xl font-bold text-warning-600">{summary.unassigned_visits}</div>
            <div className="text-sm text-text-grey">未割当</div>
          </Card>
        </div>
      )}

      {/* Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={goToPreviousDay}>
            &lt; 前日
          </Button>
          <Button variant="secondary" size="sm" onClick={goToToday}>
            今日
          </Button>
          <Button variant="secondary" size="sm" onClick={goToNextDay}>
            翌日 &gt;
          </Button>
        </div>
        <div className="text-lg font-semibold text-text-black">{formatDisplayDate(selectedDate)}</div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-main focus:border-main"
        />
      </div>

      {/* Gantt Chart */}
      {schedule && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="gantt-container">
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

            {schedule.staff_rows.map((row) => (
              <StaffRow
                key={row.staff.id}
                staffId={row.staff.id}
                staffName={row.staff.name}
                visits={row.visits}
                onVisitClick={handleVisitClick}
                onVisitContextMenu={handleVisitContextMenu}
                onEmptyClick={handleEmptyClick}
                activeId={activeId}
              />
            ))}

            {schedule.unassigned_visits.length > 0 && (
              <StaffRow
                staffId={null}
                staffName="未割当"
                visits={schedule.unassigned_visits}
                onVisitClick={handleVisitClick}
                onVisitContextMenu={handleVisitContextMenu}
                onEmptyClick={handleEmptyClick}
                activeId={activeId}
              />
            )}
          </div>

          <DragOverlay>
            {activeId && schedule && (
              <div className="px-3 py-2 bg-main text-white rounded text-sm shadow-lg">
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

      <VisitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
        visit={editingVisit}
        defaultDate={selectedDate}
        defaultTime={defaultTime ?? undefined}
        defaultStaffId={defaultStaffId}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.visit)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
