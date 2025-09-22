import React from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
    const { state, dispatch } = useApp();

    const handleMarkAsRead = (notificationId: string) => {
        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
    };

    const handleMarkAllAsRead = () => {
        state.notifications
            .filter(n => !n.read)
            .forEach(n => {
                dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id });
            });
    };

    const unreadCount = state.notifications.filter(n => !n.read).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-96">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center">
                        <Bell className="w-5 h-5 mr-2 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">การแจ้งเตือน</h3>
                        {unreadCount > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                                อ่านทั้งหมด
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto">
                    {state.notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>ไม่มีการแจ้งเตือน</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {state.notifications
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((notification, index) => (
                                    <div
                                        key={notification.id || index}
                                        className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center">
                                                    <h4 className="text-sm font-medium text-gray-900">
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.read && (
                                                        <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm text-gray-600">
                                                    {notification.message}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {new Date(notification.createdAt).toLocaleString('th-TH')}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                                                    title="ทำเครื่องหมายว่าอ่านแล้ว"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}