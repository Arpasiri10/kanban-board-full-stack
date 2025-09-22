import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tag, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { demoUsers } from '../../data/demoData';
import { Task } from '../../types';

interface TaskComponentProps {
    task: Task;
}

export default function TaskComponent({ task }: TaskComponentProps) {
    const { state, dispatch } = useApp();
    // ฟังก์ชันลบงาน (เปิด modal ยืนยัน)
    const handleDeleteTask = () => {
        setShowDeleteConfirm(true);
    };

    // ฟังก์ชันยืนยันลบงานจริง
    const confirmDeleteTask = () => {
        dispatch({
            type: 'DELETE_TASK',
            payload: task.id,
        });
        setShowDeleteConfirm(false);
    };
    // ลบการประกาศซ้ำของ dispatch
    if (!task || !task.id) {
        console.warn('TaskComponent: task หรือ id ไม่ถูกต้อง', task);
        return null;
    }
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editDescription, setEditDescription] = useState(task.description || '');
    const priority = ['low', 'medium', 'high'].includes((task.tags[0] || '').toLowerCase()) ? task.tags[0].toLowerCase() : 'low';
    const [editPriority, setEditPriority] = useState(priority);
    const [editTags, setEditTags] = useState(task.tags.filter(tag => !['low', 'medium', 'high'].includes(tag.toLowerCase())));
    const [editAssignees, setEditAssignees] = useState<string[]>(Array.isArray(task.assignedTo) ? task.assignedTo : []);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const {
        attributes,
        setNodeRef,
        transform,
        transition,
        isDragging,
        listeners,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    function getPriorityColor(priority: string) {
        if (priority === 'high') return 'bg-red-100 text-red-700';
        if (priority === 'medium') return 'bg-yellow-100 text-yellow-700';
        return 'bg-green-100 text-green-700';
    }
    function getPriorityText(priority: string) {
        if (priority === 'high') return 'High';
        if (priority === 'medium') return 'Medium';
        return 'Low';
    }

    // ดึงข้อมูลสมาชิกทั้งหมดจากระบบ (ไม่ filter ออก)
    const allUsers = (state.users && state.users.length > 0)
        ? [
            ...state.users,
            ...demoUsers.filter(d => !state.users.some(u => u.id === d.id))
        ]
        : demoUsers;
    // Assign a unique color to each user based on their id/email (เหมือน KanbanBoard)
    function getUserColor(user: { id?: string; email?: string; color?: string }) {
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
    let assignedUsers: ({ name: string; email?: string; color: string } | undefined)[] = [];
    if (Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {
        assignedUsers = task.assignedTo
            .map(id => {
                let user = allUsers.find((u: { id: string; name: string; email?: string; color?: string }) => u.id === id);
                if (!user && state.auth && state.auth.user && state.auth.user.id === id) {
                    user = state.auth.user;
                }
                if (user) {
                    // Always fallback: name > email > 'ไม่ระบุ'
                    const display = user.name && user.name.trim() !== '' ? user.name : (user.email && user.email.trim() !== '' ? user.email : 'ไม่ระบุ');
                    return { name: display, email: user.email, color: getUserColor(user) };
                }
                return undefined;
            });
        assignedUsers = assignedUsers.filter((user): user is { name: string; email?: string; color: string } => typeof user !== 'undefined');
        if (assignedUsers.length === 0) {
            assignedUsers = [{ name: 'ไม่ระบุ', color: 'bg-gray-300' }];
        }
    } else {
        assignedUsers = [{ name: 'ไม่ระบุ', color: 'bg-gray-300' }];
    }

    const handleUpdateTask = () => {
        if (!editTitle.trim()) return;
        const updatedTask = {
            ...task,
            title: editTitle.trim(),
            description: editDescription,
            tags: [editPriority, ...editTags],
            assignedTo: editAssignees,
            updatedAt: new Date(),
        };
        dispatch({
            type: 'UPDATE_TASK',
            payload: updatedTask,
        });
        // แจ้งเตือนผู้ที่ได้รับมอบหมาย (ถ้ามี)
        editAssignees.forEach(assigneeId => {
            const user = allUsers.find((u: { id: string; name: string }) => u.id === assigneeId);
            if (user) {
                const notification = {
                    id: Date.now().toString() + Math.random(),
                    userId: assigneeId,
                    type: 'task_assigned' as 'task_assigned',
                    title: 'ได้รับมอบหมายงานใหม่',
                    message: `สมาชิก ${user.name} ได้รับมอบหมายงาน "${editTitle.trim()}"`,
                    read: false,
                    createdAt: new Date(),
                };
                dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
            }
        });
        setIsEditing(false);
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className={`rounded-md shadow bg-white p-3 border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-lg ${isDragging ? 'opacity-50 rotate-2' : ''}`}
                {...attributes}
                onDoubleClick={e => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
                onClick={e => {
                    e.stopPropagation();
                }}
            >
                {/* Header: Task ID, Priority, Drag Handle */}
                <div className="flex items-center mb-2">
                    <span className="text-xs font-medium text-gray-400">ID: {task.id}</span>
                    <span className={`ml-auto inline-block px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(priority)}`}>{getPriorityText(priority)}</span>
                    {!isEditing && !showDeleteConfirm && (
                        <span
                            className="ml-2 cursor-grab text-gray-400 hover:text-gray-600"
                            {...listeners}
                            title="ลากเพื่อย้าย"
                        >
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><circle cx="5" cy="5" r="2" /><circle cx="5" cy="10" r="2" /><circle cx="5" cy="15" r="2" /><circle cx="10" cy="5" r="2" /><circle cx="10" cy="10" r="2" /><circle cx="10" cy="15" r="2" /><circle cx="15" cy="5" r="2" /><circle cx="15" cy="10" r="2" /><circle cx="15" cy="15" r="2" /></svg>
                        </span>
                    )}
                </div>
                <h4 className="text-base font-semibold text-gray-700 mb-2 leading-tight">{task.title}</h4>
                {/* Task Description */}
                {task.description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                )}
                {/* Tags (show all tags except priority) */}
                {task.tags.filter(tag => !['low', 'medium', 'high'].includes(tag.toLowerCase())).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {task.tags.filter(tag => !['low', 'medium', 'high'].includes(tag.toLowerCase())).map((tag, index) => (
                            <span
                                key={`${tag}-${index}`}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                {/* Footer: Assignees and Action Buttons */}
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                        {assignedUsers.map((user, idx) => (
                            user ? (
                                <div key={`${user.name}-${user.email}-${idx}`} className="flex items-center">
                                    <div className={`w-6 h-6 ${user.color} text-xs rounded-full flex items-center justify-center font-medium border border-white shadow-sm`}>
                                        {(user.name && user.name.length > 0) ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}
                                    </div>
                                </div>
                            ) : null
                        ))}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            tabIndex={0}
                            onClick={e => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title="Edit"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            tabIndex={0}
                            onClick={e => {
                                e.stopPropagation();
                                handleDeleteTask();
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            {/* Modal Edit Task (styled like CreateTaskModal) */}
            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsEditing(false)}>
                    <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">แก้ไขงาน</h3>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        {/* Content */}
                        <form onSubmit={e => { e.preventDefault(); handleUpdateTask(); }} className="p-6 space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่องาน *</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="ชื่องาน"
                                    required
                                />
                            </div>
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">คำอธิบาย</label>
                                <textarea
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="คำอธิบายงาน"
                                    rows={3}
                                />
                            </div>
                            {/* Assigned Users */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">มอบหมายให้</label>
                                <div className="space-y-2">
                                    {allUsers
                                        .filter(user => user.name && user.name.trim() !== '' && user.name.trim() !== 'ไม่ระบุ' && user.email && user.email.trim() !== '')
                                        .map((user: { id: string; name: string; email?: string; color?: string }) => {
                                            const color = getUserColor(user);
                                            const display = user.name;
                                            const isCurrent = user.id === state.auth.user?.id;
                                            return (
                                                <label key={`${user.id}-${user.email}`} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={editAssignees.includes(user.id)}
                                                        onChange={() => {
                                                            setEditAssignees(prev => prev.includes(user.id)
                                                                ? prev.filter(id => id !== user.id)
                                                                : [...prev, user.id]);
                                                        }}
                                                        className="mr-3 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <div className="flex items-center">
                                                        <span className="w-5 h-5 mr-2 flex items-center justify-center text-gray-400">
                                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" /></svg>
                                                        </span>
                                                        <span className="text-sm text-gray-900">{display}</span>
                                                        {isCurrent && (
                                                            <span className="ml-2 px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-xs">บัญชีของคุณ</span>
                                                        )}
                                                        {user.email && display !== user.email && (
                                                            <span className="text-xs text-gray-500 ml-2">({user.email})</span>
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                </div>
                            </div>
                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                <select
                                    value={editPriority}
                                    onChange={e => setEditPriority(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {['urgent', 'feature', 'bug', 'review', 'design', 'testing', 'done', 'frontend', 'backend', 'api', 'database', 'deploy', 'refactor', 'documentation'].map(tag => (
                                        <label key={tag} className="flex items-center text-xs bg-blue-50 px-2 py-1 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editTags.includes(tag)}
                                                onChange={() => {
                                                    setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                                                }}
                                                className="mr-2"
                                            />
                                            {tag}
                                        </label>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={editTags.filter(tag => !['urgent', 'feature', 'bug', 'review', 'design', 'testing', 'done'].includes(tag)).join(', ')}
                                        onChange={e => {
                                            const tagsArr = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                                            setEditTags(prev => [
                                                ...prev.filter(tag => ['urgent', 'feature', 'bug', 'review', 'design', 'testing', 'done'].includes(tag)),
                                                ...tagsArr
                                            ]);
                                        }}
                                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                                        placeholder="เพิ่ม tag ใหม่"
                                    />
                                </div>
                                {/* แสดง tag ที่เลือก */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {editTags.filter(tag => !['urgent', 'feature', 'bug', 'review', 'design', 'testing', 'done'].includes(tag)).map(tag => (
                                        <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 border border-blue-200 mr-1">
                                            {tag}
                                            <button type="button" className="ml-1 text-red-400 hover:text-red-600" onClick={() => setEditTags(prev => prev.filter(t => t !== tag))}>
                                                x
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditTitle(task.title);
                                        setEditDescription(task.description || '');
                                        setEditPriority(priority);
                                        setEditTags(task.tags.filter(tag => !['low', 'medium', 'high'].includes(tag.toLowerCase())));
                                        setEditAssignees(Array.isArray(task.assignedTo) ? task.assignedTo : []);
                                        setIsEditing(false);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    disabled={!editTitle.trim()}
                                >
                                    บันทึก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Delete Task */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-lg shadow-lg p-6 w-96" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-4">
                            <p className="text-lg font-semibold text-gray-800 mb-2">ยืนยันการลบงาน</p>
                            <p className="text-sm text-gray-500">คุณต้องการลบงานนี้จริงหรือไม่?</p>
                        </div>
                        <div className="flex justify-center gap-4 mt-4">
                            <button
                                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                ยกเลิก
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                onClick={confirmDeleteTask}
                            >
                                ลบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}