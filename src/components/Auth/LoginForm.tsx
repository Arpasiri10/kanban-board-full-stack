import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';

const mockUsers: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com' },
];

export default function LoginForm() {
    const { dispatch } = useApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isRegister, setIsRegister] = useState(false);


    // เชื่อมต่อ API backend
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (isRegister) {
            if (!name.trim() || !email.trim() || !password.trim()) {
                setError('กรุณากรอกข้อมูลให้ครบ');
                return;
            }
            try {
                const res = await fetch('http://localhost:4001/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: email, password })
                });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error || 'สมัครสมาชิกไม่สำเร็จ');
                    return;
                }
                // Patch: Always set name and email for new user
                const safeUser = {
                    id: data.user.id?.toString() || '',
                    name: name || email.split('@')[0] || email,
                    email: email,
                };
                dispatch({ type: 'LOGIN', payload: safeUser });
                setSuccess('สมัครสมาชิกสำเร็จ!');
                setIsRegister(false);
                setName('');
                setEmail('');
                setPassword('');
            } catch {
                setError('เกิดข้อผิดพลาด');
            }
            return;
        }
        // Login logic
        try {
            const res = await fetch('http://localhost:4001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
                return;
            }
            // เก็บ token ใน Local Storage
            localStorage.setItem('token', data.token);
            // ดึงข้อมูล user
            const userRes = await fetch('http://localhost:4001/api/auth/me', {
                headers: { 'Authorization': `Bearer ${data.token}` }
            });
            const userData = await userRes.json();
            if (userRes.ok) {
                // Patch: Always set name and email for user
                let safeName = userData.user.name;
                let safeEmail = userData.user.email || userData.user.username || '';
                if (!safeName && safeEmail) {
                    safeName = safeEmail.split('@')[0];
                }
                const safeUser = {
                    ...userData.user,
                    name: safeName || safeEmail || '',
                    email: safeEmail,
                };
                dispatch({ type: 'LOGIN', payload: safeUser });
            }
        } catch {
            setError('เกิดข้อผิดพลาด');
        }
    };

    // ตัวอย่าง quick login mock (ยังคงไว้สำหรับ dev/demo)
    const handleQuickLogin = (user: User) => {
        dispatch({ type: 'LOGIN', payload: user });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isRegister ? 'สมัครสมาชิก Kanban Board' : 'เข้าสู่ระบบ Kanban Board'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {isRegister ? 'กรอกข้อมูลเพื่อสมัครสมาชิก' : 'Sign in to your account'}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        {isRegister && (
                            <div>
                                <label htmlFor="name" className="sr-only">ชื่อที่แสดง</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="ชื่อที่แสดง"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center">{error}</div>
                    )}
                    {success && (
                        <div className="text-green-600 text-sm text-center">{success}</div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                        </button>
                    </div>
                </form>

                <div className="mt-4 text-center">
                    <button
                        className="text-indigo-600 hover:underline text-sm"
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError('');
                            setSuccess('');
                        }}
                    >
                        {isRegister ? 'กลับไปเข้าสู่ระบบ' : 'สมัครสมาชิกใหม่'}
                    </button>
                </div>

                {!isRegister && (
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-50 text-gray-500">หรือทดสอบด้วยบัญชีตัวอย่าง</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {mockUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleQuickLogin(user)}
                                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                >
                                    {user.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}