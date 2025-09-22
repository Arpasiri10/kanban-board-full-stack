import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useApp } from '../../context/AppContext';
import { Board, Column, Task, User } from '../../types';
import { demoUsers } from '../../data/demoData';
import ColumnComponent from './ColumnComponent';
import TaskComponent from './TaskComponent';
import InviteMembersModal from './InviteMembersModal';
import NotificationPanel from '../Notifications/NotificationPanel';

interface KanbanBoardProps {
    board: Board;
    onBack: () => void;
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default function KanbanBoard({ board, onBack }: KanbanBoardProps) {
    const { state, dispatch } = useApp();
    useEffect(() => {
        const syncUsers = () => {
            try {
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                if (Array.isArray(users)) {
                    dispatch({ type: 'SET_USERS', payload: users });
                }
            } catch { }
        };
        window.addEventListener('storage', syncUsers);
        syncUsers();
        return () => window.removeEventListener('storage', syncUsers);
    }, [dispatch]);

    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // แสดงเฉพาะ 5 คอลัมน์หลัก
    const defaultColumnNames = ['Backlog', 'To do', 'In progress', 'Testing', 'Done'];
    let boardColumns = state.columns.filter(col => col.boardId === board.id && defaultColumnNames.includes(col.name));

    // สร้างคอลัมน์เริ่มต้นถ้ายังไม่มีครบ 5
    useEffect(() => {
        if (boardColumns.length < 5) {
            defaultColumnNames.forEach((name, idx) => {
                if (!boardColumns.find(col => col.name === name)) {
                    const newCol: Column = {
                        id: uuidv4(),
                        boardId: board.id,
                        name,
                        position: idx,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    dispatch({ type: 'ADD_COLUMN', payload: newCol });
                }
            });
        }
        // eslint-disable-next-line
    }, [boardColumns.length, board.id]);

    // เรียงลำดับตาม defaultColumnNames
    boardColumns = defaultColumnNames.map(name => boardColumns.find(col => col.name === name)).filter(Boolean) as Column[];
    const boardTasks = state.tasks.filter(task => task.boardId === board.id);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = boardTasks.find(t => t.id === active.id);
        setActiveTask(task || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        // Find the task and its current column
        const task = boardTasks.find(t => t.id === taskId);
        if (!task) return;

        // If dropped on a column, move the task to that column
        if (overId !== task.columnId && boardColumns.some(col => col.id === overId)) {
            // Dropped on a column (move to end)
            const targetColumn = boardColumns.find(col => col.id === overId);
            if (targetColumn) {
                const tasksInColumn = boardTasks.filter(t => t.columnId === overId);
                const newPosition = tasksInColumn.length;
                dispatch({
                    type: 'MOVE_TASK',
                    payload: {
                        taskId,
                        columnId: overId,
                        position: newPosition,
                    },
                });
            }
        } else if (overId !== taskId) {
            // Reorder within the same column (dropped on another task)
            const tasksInColumn = boardTasks.filter(t => t.columnId === task.columnId).sort((a, b) => a.position - b.position);
            const oldIndex = tasksInColumn.findIndex(t => t.id === taskId);
            const newIndex = tasksInColumn.findIndex(t => t.id === overId);
            if (newIndex === -1) return;

            // สลับตำแหน่งใน array
            const reordered = [...tasksInColumn];
            const [moved] = reordered.splice(oldIndex, 1);
            reordered.splice(newIndex, 0, moved);

            // อัปเดต position ใหม่ทั้งหมด
            reordered.forEach((t, idx) => {
                dispatch({
                    type: 'MOVE_TASK',
                    payload: {
                        taskId: t.id,
                        columnId: t.columnId,
                        position: idx,
                    },
                });
            });
        }
    };

    const unreadNotifications = state.notifications.filter(n => !n.read).length;

    // รวม users จริงกับ demoUsers แบบไม่ซ้ำ id
    // รวม users จริงกับ demoUsers แบบไม่ซ้ำ id (และรวม auth.user เสมอถ้ายังไม่มีใน users)
    let allUsers: User[] = [
        ...(state.users || []),
        ...demoUsers.filter(d => !(state.users || []).some(u => u.id === d.id))
    ];
    if (state.auth.user?.id && !allUsers.some(u => u.id === state.auth.user?.id)) {
        allUsers = [...allUsers, state.auth.user];
    }
    // กรองเฉพาะ user ที่มีทั้งชื่อและอีเมล (ไม่ว่าง, ไม่ใช่ 'ไม่ระบุ')
    allUsers = allUsers.filter(u => u.name && u.name.trim() !== '' && u.name.trim() !== 'ไม่ระบุ' && u.email && u.email.trim() !== '');

    // กรอง user ที่ไม่มีชื่อออก และเตรียมสี
    function getUserColor(user: { id?: string; email?: string; color?: string }) {
        // ใช้ user.color ถ้ามี, ถ้าไม่มีก็ generate สีจาก id/email
        if (user.color) return user.color;
        const colors = [
            'bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400',
            'bg-red-400', 'bg-indigo-400', 'bg-teal-400', 'bg-orange-400', 'bg-cyan-400',
        ];
        let hash = 0;
        const str = user.id || user.email || '';
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    // Fallback: ใช้ name ถ้ามี, ถ้าไม่มีใช้ email (และไม่ filter user ที่ไม่มี name ออก)
    const boardMembers = board.members
        .map(id => {
            let user = allUsers.find(u => u.id === id);
            if (!user && state.auth.user?.id === id) user = state.auth.user;
            if (!user) return undefined;
            // Always fallback: name > email > 'ไม่ระบุ'
            let displayName = user.name && user.name.trim() !== '' ? user.name : (user.email && user.email.trim() !== '' ? user.email : 'ไม่ระบุ');
            if (displayName === 'ไม่ระบุ') return undefined;
            return {
                ...user,
                name: displayName,
                _circleColor: getUserColor(user)
            };
        })
        .filter((user): user is User & { _circleColor: string } => !!user);

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b px-4 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 w-full">
                        <button
                            onClick={onBack}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            ← กลับ
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900 truncate">{board.name}</h1>
                        <div className="flex-1" />
                        <div className="flex flex-col items-end space-y-1">
                            <div className="flex items-center gap-2">
                                {state.auth.user && (
                                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
                                        <span className="font-bold">{state.auth.user.name || (state.auth.user.email ? state.auth.user.email.split('@')[0] : '')}</span>
                                        <span className="text-xs text-gray-500">{state.auth.user.email}</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="flex items-center px-2 py-1 text-gray-600 hover:text-gray-800 text-xs border border-indigo-100 rounded"
                                >
                                    Invite members
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 justify-end">
                                {boardMembers.map((user, idx) => (
                                    <div key={`${user.id}-${idx}`} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-indigo-100 shadow-sm">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs ${user._circleColor}`}>
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-medium text-indigo-700">{user?.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(true)}
                            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800"
                        >
                            <Bell className="w-5 h-5 mr-1" />
                            {unreadNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {unreadNotifications}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Board Content */}
            <div className="flex-1 bg-gray-100 flex items-center justify-center">
                <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full h-full max-w-screen-2xl px-4">
                        {boardColumns.map((column) => (
                            <div
                                key={column.id}
                                className="h-full rounded-xl shadow-sm bg-white p-0 border border-gray-200 flex flex-col"
                            >
                                <ColumnComponent
                                    column={column}
                                    tasks={boardTasks.filter(task => task.columnId === column.id)}
                                />
                            </div>
                        ))}
                    </div>
                    <DragOverlay>
                        {activeTask ? <TaskComponent task={activeTask} /> : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Invite Members Modal */}
            {showInviteModal && (
                <InviteMembersModal
                    board={board}
                    onClose={() => setShowInviteModal(false)}
                />
            )}

            {/* Notification Panel */}
            <NotificationPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
            />
        </div>
    );
}