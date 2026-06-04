import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: "",
      isAuthenticated: false,
      setToken: (token: string) =>
        set({ token, isAuthenticated: true }),
      logout: () =>
        set({ token: "", isAuthenticated: false }),
    }),
    {
      name: "abc-group-auth",
    }
  )
);
