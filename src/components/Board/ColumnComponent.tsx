import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { Column, Task } from '../../types';
import TaskComponent from './TaskComponent';
import CreateTaskModal from './CreateTaskModal';

interface ColumnComponentProps {
    column: Column;
    tasks: Task[];
}

export default function ColumnComponent({ column, tasks }: ColumnComponentProps) {
    const [showCreateTask, setShowCreateTask] = useState(false);
    const {
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // กรองเฉพาะ 5 แถวหลัก
    const allowedColumns = [
        'Backlog',
        'To do',
        'In progress',
        'Testing',
        'Done',
    ];
    if (!allowedColumns.includes(column.name)) return null;

    // กำหนดสีหัวข้อแต่ละแถว
    const headerColors: Record<string, string> = {
        'Backlog': 'bg-blue-100 text-blue-800',
        'To do': 'bg-yellow-100 text-yellow-800',
        'In progress': 'bg-purple-100 text-purple-800',
        'Testing': 'bg-pink-100 text-pink-800',
        'Done': 'bg-green-100 text-green-800',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`h-full flex flex-col px-4 transition-all duration-300 ${isDragging ? 'opacity-50 scale-95' : ''}`}
        >
            {/* Column Header */}
            <div className={`px-4 py-3 border-b border-gray-200 flex items-center rounded-t-xl ${headerColors[column.name] || 'bg-gray-50 text-gray-700'}`}>
                <h3 className="text-base font-bold flex-1 tracking-wide">
                    {column.name}
                </h3>
            </div>
            {/* Tasks (Drag & Drop) */}
            <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
                    {tasks
                        .sort((a, b) => a.position - b.position)
                        .map((task) => (
                            <TaskComponent key={task.id} task={task} />
                        ))}
                </div>
            </SortableContext>
            {/* Add Task Button */}
            <button
                onClick={() => setShowCreateTask(true)}
                className="w-full mt-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded border border-dashed border-gray-300 text-xs flex items-center justify-center gap-1"
            >
                <Plus className="w-3 h-3" />
                <span>New Item</span>
            </button>
            {/* Create Task Modal */}
            {showCreateTask && (
                <CreateTaskModal
                    columnId={column.id}
                    boardId={column.boardId}
                    onClose={() => setShowCreateTask(false)}
                />
            )}
        </div>
    );
}