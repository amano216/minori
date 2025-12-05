import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Users, Loader2 } from 'lucide-react';
import { fetchGroups, reorderGroups } from '../../api/client';
import type { Group } from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

interface SortableGroupItemProps {
  group: Group;
}

function SortableGroupItem({ group }: SortableGroupItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg
        ${isDragging ? 'shadow-lg opacity-90 z-10' : 'shadow-sm'}
      `}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
        aria-label="ドラッグして並び替え"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 flex-1">
        <Users className="w-4 h-4 text-gray-400" />
        <span className="font-medium text-text-primary">
          {group.parent_name ? `${group.parent_name} > ${group.name}` : group.name}
        </span>
      </div>
      {group.position != null && (
        <span className="text-xs text-gray-400">#{group.position}</span>
      )}
    </div>
  );
}

export function GroupReorderSection() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const data = await fetchGroups();
      // position順でソート（nullは最後）
      const sorted = [...data].sort((a, b) => {
        if (a.position == null && b.position == null) return 0;
        if (a.position == null) return 1;
        if (b.position == null) return -1;
        return a.position - b.position;
      });
      setGroups(sorted);
    } catch (error) {
      console.error('Failed to load groups:', error);
      showToast('error', 'グループの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex((g) => g.id === active.id);
      const newIndex = groups.findIndex((g) => g.id === over.id);

      const newGroups = arrayMove(groups, oldIndex, newIndex);
      setGroups(newGroups);

      // APIに保存
      try {
        setIsSaving(true);
        const groupIds = newGroups.map((g) => g.id);
        await reorderGroups(groupIds);
        showToast('success', 'グループの並び順を保存しました');
        
        // positionを更新
        setGroups(newGroups.map((g, index) => ({ ...g, position: index + 1 })));
      } catch (error) {
        console.error('Failed to save group order:', error);
        showToast('error', '並び順の保存に失敗しました');
        // 元に戻す
        loadGroups();
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        グループがありません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-text-secondary">
          ドラッグして並び替えできます。この順序は計画レーンの表示順に反映されます。
        </p>
        {isSaving && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            保存中...
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={groups.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {groups.map((group) => (
              <SortableGroupItem key={group.id} group={group} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
