import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@aptiquiz/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) => set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
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