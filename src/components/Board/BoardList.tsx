import React, { useState } from 'react';
import { Plus, Trash2, Users, Calendar, Edit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Board } from '../../types';
interface BoardListProps {
    onSelectBoard: (board: Board) => void;
    showLogoutButton?: boolean;
    onLogout?: () => void;
}

export default function BoardList({ onSelectBoard, showLogoutButton, onLogout }: BoardListProps) {
    const { state, dispatch } = useApp();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardDescription, setNewBoardDescription] = useState('');
    const [editBoardId, setEditBoardId] = useState<string | null>(null);
    const [editBoardName, setEditBoardName] = useState('');
    const [editBoardDescription, setEditBoardDescription] = useState('');

    const handleCreateBoard = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBoardName.trim()) return;
        const newBoard: Board = {
            id: Date.now().toString(),
            name: newBoardName.trim(),
            description: newBoardDescription.trim(),
            ownerId: state.auth.user?.id || '',
            members: state.auth.user ? [state.auth.user.id] : [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        dispatch({ type: 'ADD_BOARD', payload: newBoard });
        setNewBoardName('');
        setNewBoardDescription('');
        setShowCreateForm(false);
    };

    const handleDeleteBoard = (boardId: string) => {
        if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบ Board นี้?')) {
            dispatch({ type: 'DELETE_BOARD', payload: boardId });
        }
    };

    const handleEditBoard = (board: Board) => {
        setEditBoardId(board.id);
        setEditBoardName(board.name);
        setEditBoardDescription(board.description || '');
    };

    const handleSaveEditBoard = () => {
        if (!editBoardId || !editBoardName.trim()) return;
        dispatch({
            type: 'UPDATE_BOARD',
            payload: {
                ...state.boards.find(b => b.id === editBoardId)!,
                name: editBoardName.trim(),
                description: editBoardDescription.trim(),
                updatedAt: new Date(),
            },
        });
        setEditBoardId(null);
        setEditBoardName('');
        setEditBoardDescription('');
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Boards ของฉัน</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-full shadow hover:from-indigo-600 hover:to-blue-600 transition-all duration-150 text-base font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        สร้าง Board ใหม่
                    </button>
                    {showLogoutButton && (
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow hover:from-red-600 hover:to-pink-600 transition-all duration-150 text-base font-medium"
                        >
                            ออกจากระบบ
                        </button>
                    )}
                </div>
            </div>

            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">สร้าง Board ใหม่</h3>
                        <form onSubmit={handleCreateBoard}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ชื่อ Board
                                </label>
                                <input
                                    type="text"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="ชื่อ Board"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    คำอธิบาย (ไม่บังคับ)
                                </label>
                                <textarea
                                    value={newBoardDescription}
                                    onChange={(e) => setNewBoardDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="คำอธิบาย Board"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    สร้าง
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Board Modal */}
            {editBoardId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">แก้ไข Board</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ Board</label>
                            <input
                                type="text"
                                value={editBoardName}
                                onChange={e => setEditBoardName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">คำอธิบาย (ไม่บังคับ)</label>
                            <textarea
                                value={editBoardDescription}
                                onChange={e => setEditBoardDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setEditBoardId(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEditBoard}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.boards.map((board) => (
                    <div
                        key={board.id}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => {
                            dispatch({ type: 'SET_CURRENT_BOARD', payload: board });
                            onSelectBoard(board);
                        }}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">{board.name}</h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleEditBoard(board);
                                        }}
                                        className="text-yellow-500 hover:text-yellow-700"
                                        title="แก้ไข Board"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleDeleteBoard(board.id);
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                        title="ลบ Board"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {board.description && (
                                <p className="text-gray-600 text-sm mb-4">{board.description}</p>
                            )}

                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    <span>{board.members.length} สมาชิก</span>
                                </div>
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    <span>{new Date(board.createdAt).toLocaleDateString('th-TH')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {state.boards.length === 0 && (
                    <div className="col-span-full text-center py-12">
                        <div className="text-gray-500">
                            <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg">ยังไม่มี Board</p>
                            <p className="text-sm">คลิกปุ่ม "สร้าง Board ใหม่" เพื่อเริ่มต้น</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}