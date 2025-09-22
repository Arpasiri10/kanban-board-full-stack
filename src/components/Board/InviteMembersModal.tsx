import { useState, useEffect } from 'react';
import { X, UserPlus, Mail } from 'lucide-react';
import { useApp, addBoardMember } from '../../context/AppContext';
import { Board, User } from '../../types';
import { demoUsers } from '../../data/demoData'; // fallback only

interface InviteMembersModalProps {
    board: Board;
    onClose: () => void;
}

export default function InviteMembersModal({ board, onClose }: InviteMembersModalProps) {
    const { state, dispatch } = useApp();
    // ใช้ users จาก context เสมอ ไม่ต้องอ่านจาก localStorage
    // ใช้ state.users เป็นหลัก ถ้ามีผู้ใช้จริงในระบบ
    // รวม users จริงกับ demoUsers แบบไม่ซ้ำ id
    // users = users จริง + demoUsers (ไม่ซ้ำ id)
    const [refreshKey, setRefreshKey] = useState(0);
    // force re-render เมื่อ state.users เปลี่ยน
    useEffect(() => { setRefreshKey(k => k + 1); }, [state.users]);
    let users: User[] = [
        ...(state.users || []),
        ...demoUsers.filter(d => !(state.users || []).some(u => u.id === d.id))
    ];

    // --- ฟังก์ชันตรวจสอบและลบ user (ใน scope หลัก component) ---
    const isDemoUser = (user: User) => demoUsers.some((d: User) => d.id === user.id);
    const handleDeleteUser = (userId: string) => {
        const userToDelete = users.find((u: User) => u.id === userId);
        if (!userToDelete) return;
        if (userId === state.auth.user?.id) return; // ห้ามลบบัญชีที่ล็อกอิน
        if (isDemoUser(userToDelete)) return; // ห้ามลบ demo
        const updatedUsers = (state.users || []).filter((u: User) => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        dispatch({ type: 'SET_USERS', payload: updatedUsers });
        setRefreshKey(k => k + 1); // force re-render
    };
    const [searchEmail, setSearchEmail] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    // New user creation state
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [addUserError, setAddUserError] = useState('');

    // Filter users: เฉพาะ user ที่ยังไม่อยู่ใน board, ไม่ใช่ตัวเอง, และไม่ใช่ 'ไม่ระบุ'
    const availableUsers = users.filter(
        user =>
            !board.members.includes(user.id) &&
            user.id !== state.auth.user?.id &&
            !(user.name && user.name.trim() === 'ไม่ระบุ')
    );

    // Fallback: ใช้ name ถ้ามี, ถ้าไม่มีใช้ email
    const filteredUsers = availableUsers.filter(user => {
        // Always fallback: name > email > 'ไม่ระบุ'
        const display = user.name && user.name.trim() !== '' ? user.name : (user.email && user.email.trim() !== '' ? user.email : 'ไม่ระบุ');
        return display.toLowerCase().includes(searchEmail.toLowerCase());
    });

    const handleToggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Add new user to system and select for invite
    const handleAddNewUser = () => {
        if (!newUserName.trim() || !newUserEmail.trim()) {
            setAddUserError('กรุณากรอกชื่อและอีเมล');
            return;
        }
        // Check for duplicate email
        if (users.some(u => u.email === newUserEmail.trim())) {
            setAddUserError('อีเมลนี้ถูกใช้แล้ว');
            return;
        }
        const newUser: User = {
            id: 'u' + Date.now(),
            name: newUserName.trim(),
            email: newUserEmail.trim(),
        };
        // Add to localStorage and context
        const updatedUsers = [...users, newUser];
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        dispatch({ type: 'SET_USERS', payload: updatedUsers });
        setSelectedUsers(prev => [...prev, newUser.id]);
        setNewUserName('');
        setNewUserEmail('');
        setAddUserError('');
    };

    const handleInviteUsers = () => {
        if (selectedUsers.length === 0) return;

        // Update board with new members in localStorage
        selectedUsers.forEach(userId => {
            addBoardMember(board.id, userId);
        });

        // Update board in state
        const updatedBoard = {
            ...board,
            members: [...board.members, ...selectedUsers],
            updatedAt: new Date(),
        };
        dispatch({ type: 'UPDATE_BOARD', payload: updatedBoard });

        // Create notifications for invited users
        selectedUsers.forEach(userId => {
            const user = users.find(u => u.id === userId);
            if (user) {
                const notification = {
                    id: Date.now().toString() + Math.random(),
                    userId,
                    type: 'board_invited' as const,
                    title: 'ได้รับเชิญเข้าร่วม Board',
                    message: `สมาชิก ${user.name} ได้รับเชิญเข้าร่วม Board "${board.name}"`,
                    read: false,
                    createdAt: new Date(),
                };
                dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
            }
        });

        // อัปเดต users ใน context จาก localStorage (กรณี users ถูกเปลี่ยนจากที่อื่น)
        try {
            const latestUsers = JSON.parse(localStorage.getItem('users') || '[]');
            if (Array.isArray(latestUsers)) {
                dispatch({ type: 'SET_USERS', payload: latestUsers });
            }
        } catch { }

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-sm mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">เชิญสมาชิก</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 py-4">
                    {/* Add New User */}
                    <div className="mb-4 border-b pb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">เพิ่มบัญชีใหม่</label>
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
                    </div>
                    {/* Search */}
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ค้นหาผู้ใช้
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                placeholder="ค้นหาด้วยชื่อหรืออีเมล"
                            />
                        </div>
                    </div>

                    {/* User List */}
                    <div className="mb-4" key={refreshKey}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            เลือกผู้ใช้ที่ต้องการเชิญ
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                            {filteredUsers.length === 0 ? (
                                <div className="p-2 text-center text-gray-500 text-sm">
                                    {searchEmail ? 'ไม่พบผู้ใช้ที่ตรงกับคำค้นหา' : 'ไม่มีผู้ใช้ที่สามารถเชิญได้'}
                                </div>
                            ) : (
                                filteredUsers.filter(user => user.name && user.name.trim() !== 'ไม่ระบุ' && (user.name.trim() !== '' || (user.email && user.email.trim() !== ''))).map(user => (
                                    <div
                                        key={`${user.id}-${user.email}`}
                                        className="flex items-center px-2 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => handleToggleUser(user.id)}
                                            className="mr-3 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div className="flex-1" onClick={() => handleToggleUser(user.id)}>
                                            <div className="font-medium text-gray-900">{user.name && user.name.trim() !== '' ? user.name : (user.email && user.email.trim() !== '' ? user.email : 'ไม่ระบุ')}</div>
                                            {user.name && user.name.trim() !== '' && user.email && user.email.trim() !== '' && (
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            )}
                                        </div>
                                        {/* ปุ่มลบ user เฉพาะ user ที่ไม่ใช่บัญชีล็อกอินและไม่ใช่ demo */}
                                        {!isDemoUser(user) && user.id !== state.auth.user?.id && (
                                            <button
                                                className="ml-2 text-red-500 hover:text-red-700 text-xs border border-red-200 rounded px-2 py-0.5"
                                                onClick={() => handleDeleteUser(user.id)}
                                                title="ลบผู้ใช้นี้ออกจากระบบ"
                                            >ลบ</button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Selected Users Summary */}
                    {selectedUsers.length > 0 && (
                        <div className="mb-3 p-2 bg-indigo-50 rounded-md">
                            <div className="text-xs text-indigo-800">
                                เลือกแล้ว {selectedUsers.length} คน
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 mt-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleInviteUsers}
                            disabled={selectedUsers.length === 0}
                            className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            เชิญสมาชิก
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}