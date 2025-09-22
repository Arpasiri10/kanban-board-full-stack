// Board member management functions
export function addBoardMember(boardId: string, userId: string) {
    const boardsStr = localStorage.getItem('kanban-app-state');
    if (!boardsStr) return;
    const state = JSON.parse(boardsStr);
    const board = state.boards.find((b: any) => b.id === boardId);
    if (!board) return;
    if (!board.members.includes(userId)) {
        board.members.push(userId);
        board.updatedAt = new Date();
        localStorage.setItem('kanban-app-state', JSON.stringify(state));
    }
}

export function removeBoardMember(boardId: string, userId: string) {
    const boardsStr = localStorage.getItem('kanban-app-state');
    if (!boardsStr) return;
    const state = JSON.parse(boardsStr);
    const board = state.boards.find((b: any) => b.id === boardId);
    if (!board) return;
    board.members = board.members.filter((id: string) => id !== userId);
    board.updatedAt = new Date();
    localStorage.setItem('kanban-app-state', JSON.stringify(state));
}

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, User, Board, Column, Task, Notification } from '../types';
import { demoBoards, demoColumns, demoTasks, demoUsers } from '../data/demoData';

type AppAction =
    | { type: 'LOGIN'; payload: User }
    | { type: 'LOGOUT' }
    | { type: 'SET_BOARDS'; payload: Board[] }
    | { type: 'ADD_BOARD'; payload: Board }
    | { type: 'UPDATE_BOARD'; payload: Board }
    | { type: 'DELETE_BOARD'; payload: string }
    | { type: 'SET_CURRENT_BOARD'; payload: Board | null }
    | { type: 'SET_COLUMNS'; payload: Column[] }
    | { type: 'ADD_COLUMN'; payload: Column }
    | { type: 'UPDATE_COLUMN'; payload: Column }
    | { type: 'DELETE_COLUMN'; payload: string }
    | { type: 'SET_TASKS'; payload: Task[] }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'MOVE_TASK'; payload: { taskId: string; columnId: string; position: number } }
    | { type: 'ADD_NOTIFICATION'; payload: Notification }
    | { type: 'MARK_NOTIFICATION_READ'; payload: string }
    | { type: 'SET_USERS'; payload: User[] };

const initialState: AppState & { users?: User[] } = {
    auth: {
        user: null,
        isAuthenticated: false,
    },
    boards: [],
    currentBoard: null,
    columns: [],
    tasks: [],
    notifications: [],
    users: [],
};

function appReducer(state: AppState & { users?: User[] }, action: AppAction): AppState & { users?: User[] } {
    switch (action.type) {
        case 'SET_USERS':
            return { ...state, users: action.payload };
        case 'LOGIN': {
            // Add user to users list if not present (case-insensitive email)
            let users = state.users || [];
            const emailLower = (action.payload.email || '').toLowerCase();
            let existingUser = users.find(u =>
                u.id === action.payload.id ||
                (u.email && u.email.toLowerCase() === emailLower)
            );
            if (!existingUser) {
                users = [...users, action.payload];
            } else {
                // ถ้ามี user เดิมแล้ว อัปเดตข้อมูล (เช่น name เปลี่ยน)
                users = users.map(u =>
                    (u.id === action.payload.id || (u.email && u.email.toLowerCase() === emailLower))
                        ? { ...u, ...action.payload }
                        : u
                );
            }
            // Persist to localStorage
            localStorage.setItem('users', JSON.stringify(users));

            // เพิ่ม user.id เข้า board.members ของทุก board ที่ยังไม่มี user.id นี้ และลบ id ซ้ำ
            const updatedBoards = (state.boards || []).map(board => {
                let newMembers = [...board.members, action.payload.id];
                // ลบ id ซ้ำ
                newMembers = Array.from(new Set(newMembers));
                return {
                    ...board,
                    members: newMembers,
                    updatedAt: new Date(),
                };
            });

            return {
                ...state,
                users,
                boards: updatedBoards,
                auth: {
                    user: action.payload,
                    isAuthenticated: true,
                },
            };
        }
        case 'LOGOUT':
            return {
                ...state,
                auth: {
                    user: null,
                    isAuthenticated: false,
                },
            };
        case 'SET_BOARDS':
            return { ...state, boards: action.payload };
        case 'ADD_BOARD':
            return { ...state, boards: [...state.boards, action.payload] };
        case 'UPDATE_BOARD':
            return {
                ...state,
                boards: state.boards.map(board =>
                    board.id === action.payload.id ? action.payload : board
                ),
            };
        case 'DELETE_BOARD':
            return {
                ...state,
                boards: state.boards.filter(board => board.id !== action.payload),
                currentBoard: state.currentBoard?.id === action.payload ? null : state.currentBoard,
            };
        case 'SET_CURRENT_BOARD':
            return { ...state, currentBoard: action.payload };
        case 'SET_COLUMNS':
            return { ...state, columns: action.payload };
        case 'ADD_COLUMN':
            return { ...state, columns: [...state.columns, action.payload] };
        case 'UPDATE_COLUMN':
            return {
                ...state,
                columns: state.columns.map(column =>
                    column.id === action.payload.id ? action.payload : column
                ),
            };
        case 'DELETE_COLUMN':
            return {
                ...state,
                columns: state.columns.filter(column => column.id !== action.payload),
                tasks: state.tasks.filter(task => task.columnId !== action.payload),
            };
        case 'SET_TASKS':
            return { ...state, tasks: action.payload };
        case 'ADD_TASK':
            return { ...state, tasks: [...state.tasks, action.payload] };
        case 'UPDATE_TASK':
            return {
                ...state,
                tasks: state.tasks.map(task =>
                    task.id === action.payload.id ? action.payload : task
                ),
            };
        case 'DELETE_TASK':
            return {
                ...state,
                tasks: state.tasks.filter(task => task.id !== action.payload),
            };
        case 'MOVE_TASK':
            return {
                ...state,
                tasks: state.tasks.map(task =>
                    task.id === action.payload.taskId
                        ? { ...task, columnId: action.payload.columnId, position: action.payload.position }
                        : task
                ),
            };
        case 'ADD_NOTIFICATION':
            return { ...state, notifications: [action.payload, ...state.notifications] };
        case 'MARK_NOTIFICATION_READ':
            return {
                ...state,
                notifications: state.notifications.map(notification =>
                    notification.id === action.payload
                        ? { ...notification, read: true }
                        : notification
                ),
            };
        default:
            return state;
    }
}

const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
} | null>(null);


function getInitialState(): AppState & { users?: User[] } {
    let savedState = localStorage.getItem('kanban-app-state');
    let users: User[] = [];
    let usersStr = localStorage.getItem('users');
    if (usersStr) {
        try {
            users = JSON.parse(usersStr);
        } catch { users = demoUsers; }
    } else {
        users = demoUsers;
        localStorage.setItem('users', JSON.stringify(users));
    }
    if (savedState === null || savedState === undefined) {
        const demoState = {
            ...initialState,
            boards: demoBoards,
            columns: demoColumns,
            tasks: demoTasks,
            users,
        };
        localStorage.setItem('kanban-app-state', JSON.stringify(demoState));
        savedState = JSON.stringify(demoState);
    }
    try {
        const parsedState = JSON.parse(savedState!);
        return {
            ...initialState,
            ...parsedState,
            boards: parsedState.boards?.map((board: any) => ({
                ...board,
                createdAt: new Date(board.createdAt),
                updatedAt: new Date(board.updatedAt),
            })) || [],
            columns: parsedState.columns?.map((column: any) => ({
                ...column,
                createdAt: new Date(column.createdAt),
                updatedAt: new Date(column.updatedAt),
            })) || [],
            tasks: parsedState.tasks?.map((task: any) => ({
                ...task,
                createdAt: new Date(task.createdAt),
                updatedAt: new Date(task.updatedAt),
            })) || [],
            notifications: parsedState.notifications?.map((notification: any) => ({
                ...notification,
                createdAt: new Date(notification.createdAt),
            })) || [],
            users: parsedState.users || users,
        };
    } catch (error) {
        console.error('Error loading state from localStorage:', error);
        return { ...initialState, users };
    }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
    // ไม่ merge demoUsers อัตโนมัติใน users (users = เฉพาะบัญชีจริง)
    const [state, dispatch] = useReducer(appReducer, initialState, (init) => getInitialState());


    // Save state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('kanban-app-state', JSON.stringify(state));
        // Sync currentUser in localStorage with state.auth.user
        if (state.auth.user) {
            localStorage.setItem('currentUser', JSON.stringify(state.auth.user));
        } else {
            localStorage.removeItem('currentUser');
        }
        // Sync users array to localStorage
        if (state.users && Array.isArray(state.users)) {
            localStorage.setItem('users', JSON.stringify(state.users));
        }
    }, [state]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
}


export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

// Get current user session
export function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}