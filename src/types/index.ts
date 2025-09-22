export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  columnId: string;
  boardId: string;
  title: string;
  description?: string;
  position: number;
  assignedTo?: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'board_invited' | 'task_updated';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface AppState {
  auth: AuthState;
  boards: Board[];
  currentBoard: Board | null;
  columns: Column[];
  tasks: Task[];
  notifications: Notification[];
  users: User[];
}