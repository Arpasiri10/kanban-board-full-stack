import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';

interface CreateTaskModalProps {
    columnId: string;
    boardId: string;
    onClose: () => void;
}

import { demoUsers } from '../../data/demoData';

export default function CreateTaskModal({ columnId, boardId, onClose }: CreateTaskModalProps) {
    const { state, dispatch } = useApp();
    // ใช้ users จาก context เสมอ ไม่ต้องอ่านจาก localStorage
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');

    // ใช้ state.users เป็นหลัก ถ้ามีผู้ใช้จริงในระบบ
    // รวม users จริงกับ demoUsers แบบไม่ซ้ำ id
    const [refreshKey, setRefreshKey] = useState(0);
    useEffect(() => { setRefreshKey(k => k + 1); }, [state.users]);
    let allUsers = [
        ...(state.users || []),
        ...demoUsers.filter(d => !(state.users || []).some(u => u.id === d.id))
    ];
    // กรองเฉพาะ user ที่มีทั้งชื่อและอีเมล (ไม่ว่าง, ไม่ใช่ 'ไม่ระบุ')
    allUsers = allUsers.filter(u => u.name && u.name.trim() !== '' && u.name.trim() !== 'ไม่ระบุ' && u.email && u.email.trim() !== '');
    // New user creation state
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [addUserError, setAddUserError] = useState('');
    // Add new user to system and select for assign
    const handleAddNewUser = () => {
        if (!newUserName.trim() || !newUserEmail.trim()) {
            setAddUserError('กรุณากรอกชื่อและอีเมล');
            return;
        }
        if (allUsers.some(u => u.email === newUserEmail.trim())) {
            setAddUserError('อีเมลนี้ถูกใช้แล้ว');
            return;
        }
        const newUser = {
            id: 'u' + Date.now(),
            name: newUserName.trim(),
            email: newUserEmail.trim(),
        };
        const updatedUsers = [...(state.users || []), newUser];
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        dispatch({ type: 'SET_USERS', payload: updatedUsers });
        setAssignedTo(prev => [...prev, newUser.id]);
        setNewUserName('');
        setNewUserEmail('');
        setAddUserError('');
    };

    // Fallback: ใช้ name ถ้ามี, ถ้าไม่มีใช้ email
    // Always fallback: name > email > 'ไม่ระบุ'
    const getUserDisplay = (user: { name?: string; email?: string }) =>
        user.name && user.name.trim() !== '' ? user.name : (user.email && user.email.trim() !== '' ? user.email : 'ไม่ระบุ');


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        // Get tasks in the column to determine position
        const tasksInColumn = state.tasks.filter(task => task.columnId === columnId);
        const position = tasksInColumn.length;

        // หา id ล่าสุดที่เป็นตัวเลขในทุก tasks แล้ว +1
        const allTasks = state.tasks;
        const numericIds = allTasks
            .map(t => parseInt(t.id, 10))
            .filter(n => !isNaN(n));
        const lastId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
        const newTask: Task = {
            id: (lastId + 1).toString(),
            columnId,
            boardId,
            title: title.trim(),
            description: description.trim() || undefined,
            position,
            assignedTo: assignedTo.length > 0 ? assignedTo : undefined,
            tags,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        console.log('สร้าง Task ใหม่:', newTask);
        dispatch({ type: 'ADD_TASK', payload: newTask });

        // Create notifications for assigned users
        // ใช้ allUsers เพื่อรองรับสมาชิกที่สมัครใหม่
        assignedTo.forEach(userId => {
            const user = allUsers.find((u: { id: string; name: string }) => u.id === userId);
            if (user) {
                const notification = {
                    id: Date.now().toString() + Math.random(),
                    userId,
                    type: 'task_assigned' as const,
                    title: 'ได้รับมอบหมายงานใหม่',
                    message: `สมาชิก ${user.name} ได้รับมอบหมายงาน "${title.trim()}"`,
                    read: false,
                    createdAt: new Date(),
                };
                dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
            }
        });

        onClose();
    };

    const handleToggleUser = (userId: string) => {
        setAssignedTo(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleToggleTag = (tag: string) => {
        setTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleAddCustomTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags(prev => [...prev, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(prev => prev.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-sm mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">สร้างงานใหม่</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ชื่องาน *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="ชื่องาน"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            คำอธิบาย
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="คำอธิบายงาน"
                            rows={3}
                        />
                    </div>

                    {/* Assigned Users */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">มอบหมายให้</label>
                        {/* Add New User */}
                        <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:items-center">
                            <div className="flex flex-row gap-2 w-full">
                                <input
                                    type="text"
                                    placeholder="ชื่อที่แสดง"
                                    value={newUserName}
                                    onChange={e => setNewUserName(e.target.value)}
                                    className="w-1/2 px-2 py-1 border rounded text-sm"
                                />
                                <input
                                    type="email"
                                    placeholder="อีเมล"
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                    className="w-1/2 px-2 py-1 border rounded text-sm"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddNewUser}
                                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm w-full sm:w-auto"
                            >เพิ่ม</button>
                        </div>
                        {addUserError && <div className="text-red-500 text-xs mt-1">{addUserError}</div>}
                        <div className="space-y-2 mt-2">
                            {allUsers.map((user: { id: string; name: string; email?: string; color?: string }) => {
                                const display = user.name;
                                const isCurrent = user.id === state.auth.user?.id;
                                return (
                                    <label key={`${user.id}-${user.email}`} className="flex items-center text-sm">
                                        <input
                                            type="checkbox"
                                            checked={assignedTo.includes(user.id)}
                                            onChange={() => handleToggleUser(user.id)}
                                            className="mr-3 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 mr-2 text-gray-400" />
                                            <span className="text-gray-900">{display}</span>
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
                            value={tags.find(tag => ['low', 'medium', 'high'].includes(tag)) || 'low'}
                            onChange={e => {
                                const newPriority = e.target.value;
                                setTags(prev => [newPriority, ...prev.filter(tag => !['low', 'medium', 'high'].includes(tag))]);
                            }}
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
                                        checked={tags.includes(tag)}
                                        onChange={() => handleToggleTag(tag)}
                                        className="mr-2"
                                    />
                                    {tag}
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                                placeholder="เพิ่ม tag ใหม่"
                            />
                            <button
                                type="button"
                                onClick={handleAddCustomTag}
                                className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs"
                            >
                                เพิ่ม
                            </button>
                        </div>
                        {/* แสดง tag ที่เลือก */}
                        <div className="flex flex-wrap gap-1 mt-2">
                            {tags.filter(tag => !['low', 'medium', 'high'].includes(tag)).map(tag => (
                                <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 border border-blue-200 mr-1">
                                    {tag}
                                    <button type="button" className="ml-1 text-red-400 hover:text-red-600" onClick={() => handleRemoveTag(tag)}>
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
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            สร้างงาน
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}