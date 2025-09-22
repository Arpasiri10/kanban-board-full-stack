import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const mockUsers = [
    { id: 'u1', username: 'alice', password: '1234', name: 'Alice', color: 'bg-pink-300' },
    { id: 'u2', username: 'bob', password: '5678', name: 'Bob', color: 'bg-blue-300' },
];

function saveUsersToLocalStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(mockUsers));
    }
}

export default function RegisterLogin() {
    const { dispatch } = useApp();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        saveUsersToLocalStorage();
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find((u: any) => u.username === username && u.password === password);
        if (user) {
            // Always set name and email fallback
            const safeName = user.name && user.name.trim() !== '' ? user.name : (user.username || (user.email ? user.email.split('@')[0] : ''));
            const safeEmail = user.email || `${user.username}@example.com`;
            const safeUser = {
                ...user,
                name: safeName,
                email: safeEmail,
            };
            localStorage.setItem('currentUser', JSON.stringify(safeUser));
            dispatch({ type: 'LOGIN', payload: safeUser });
            setError('');
        } else {
            setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim() || !name.trim()) {
            setError('กรุณากรอกข้อมูลให้ครบ');
            return;
        }
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some((u: any) => u.username === username)) {
            setError('Username นี้ถูกใช้แล้ว');
            return;
        }
        // Always set name and email fallback
        let safeName = name && name.trim() !== '' ? name : (username || (username.includes('@') ? username.split('@')[0] : ''));
        if (!safeName) safeName = 'User';
        const safeEmail = `${username}@example.com`;
        const newUser = {
            id: 'u' + Date.now(),
            username,
            password,
            name: safeName,
            email: safeEmail,
            color: 'bg-gray-300',
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        dispatch({ type: 'LOGIN', payload: newUser });
        dispatch({ type: 'SET_USERS', payload: users }); // sync รายชื่อสมาชิกใหม่เข้า state ทันที
        setSuccess('สมัครสมาชิกสำเร็จ!');
        setError('');
        setIsRegister(false);
        setUsername('');
        setPassword('');
        setName('');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded shadow w-80">
                <h2 className="text-xl font-bold mb-4 text-center">{isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</h2>
                <form onSubmit={isRegister ? handleRegister : handleLogin}>
                    {isRegister && (
                        <input
                            type="text"
                            placeholder="ชื่อที่แสดง"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 mb-3 border rounded"
                        />
                    )}
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full px-3 py-2 mb-3 border rounded"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-3 py-2 mb-3 border rounded"
                    />
                    {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
                    {success && <div className="text-green-500 text-sm mb-2">{success}</div>}
                    <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">{isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</button>
                </form>
                <div className="mt-4 text-xs text-gray-500 text-center">
                    Mock user: alice/1234, bob/5678, charlie/9999
                </div>
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
            </div>
        </div>
    );
}