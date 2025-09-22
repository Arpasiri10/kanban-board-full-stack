import { useState } from 'react';
import { useApp, addBoardMember, removeBoardMember } from '../../context/AppContext';
import { Board, User } from '../../types';

interface ManageMembersModalProps {
    board: Board;
    onClose: () => void;
}

export default function ManageMembersModal({ board, onClose }: ManageMembersModalProps) {
    const { state, dispatch } = useApp();
    let users: User[] = state.users && state.users.length > 0 ? state.users : [];
    // รวม auth.user ถ้ายังไม่มีใน users
    if (state.auth.user?.id && !users.some(u => u.id === state.auth.user?.id)) {
        users = [...users, state.auth.user];
    }
    const [selectedUserId, setSelectedUserId] = useState('');
    const [error, setError] = useState('');

    // Filter out users with name 'ไม่ระบุ', empty name, and empty email
    const isValidUser = (u: User) => u.name && u.name.trim() !== 'ไม่ระบุ' && (u.name.trim() !== '' || (u.email && u.email.trim() !== ''));
    const boardMembers = users.filter(u => board.members.includes(u.id)).filter(isValidUser);
    const availableUsers = users.filter(u => !board.members.includes(u.id)).filter(isValidUser);
    // Always fallback: name > email > 'ไม่ระบุ'
    const getUserDisplay = (user: User) => user.name && user.name.trim() !== '' ? user.name : (user.email && user.email.trim() !== '' ? user.email : 'ไม่ระบุ');

    const handleAddMember = () => {
        if (!selectedUserId) {
            setError('กรุณาเลือกสมาชิก');
            return;
        }
        addBoardMember(board.id, selectedUserId);
        dispatch({
            type: 'UPDATE_BOARD',
            payload: {
                ...board,
                members: [...board.members, selectedUserId],
                updatedAt: new Date(),
            },
        });
        setSelectedUserId('');
        setError('');
    };

    const handleRemoveMember = (userId: string) => {
        if (window.confirm('ต้องการลบสมาชิกนี้ออกจาก board จริงหรือไม่?')) {
            removeBoardMember(board.id, userId);
            dispatch({
                type: 'UPDATE_BOARD',
                payload: {
                    ...board,
                    members: board.members.filter(id => id !== userId),
                    updatedAt: new Date(),
                },
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                <h3 className="text-lg font-semibold mb-4">จัดการสมาชิก Board</h3>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">เพิ่มสมาชิก</label>
                    <select
                        value={selectedUserId}
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    >
                        <option value="">เลือกสมาชิก...</option>
                        {availableUsers.map(user => (
                            <option key={user.id} value={user.id}>{getUserDisplay(user)}</option>
                        ))}
                    </select>
                    {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
                    <button
                        onClick={handleAddMember}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 w-full"
                    >
                        เพิ่มสมาชิก
                    </button>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">สมาชิกปัจจุบัน</label>
                    <ul className="divide-y divide-gray-200">
                        {boardMembers.map(user => (
                            <li key={user.id} className="flex items-center justify-between py-2">
                                <span>{getUserDisplay(user)}</span>
                                <button
                                    onClick={() => handleRemoveMember(user.id)}
                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-700"
                                >
                                    ลบ
                                </button>
                            </li>
                        ))}
                        {boardMembers.length === 0 && (
                            <li className="text-gray-500 py-2">ไม่มีสมาชิกใน board นี้</li>
                        )}
                    </ul>
                </div>
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
}