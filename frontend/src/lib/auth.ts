import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@aptiquiz/shared';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  collegeId?: string;
  branchId?: string;
  semester?: number;
  year?: number;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  loadFromStorage: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) => set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to login');
          }
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      register: async (registerData) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to register');
          }
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('aptiquiz-auth');
        }
      },
      loadFromStorage: () => {
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('aptiquiz-auth');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed?.state?.token && parsed?.state?.user) {
                set({
                  user: parsed.state.user,
                  token: parsed.state.token,
                  isAuthenticated: true,
                });
              }
            }
          } catch (e) {
            console.error('Error loading auth from storage', e);
          }
        }
      },
    }),
    {
      name: 'aptiquiz-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export function getAuthHeader(): string | undefined {
  const token = useAuthStore.getState().token;
  return token ? `Bearer ${token}` : undefined;
}

export function hasRole(...roles: UserRole[]): boolean {
  const user = useAuthStore.getState().user;
  return user ? roles.includes(user.role) : false;
}

export function isHostOrAdmin(): boolean {
  return hasRole(UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN);
}