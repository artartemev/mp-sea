// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// Определяем тип для данных от Telegram
type TelegramUserData = {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

// Определяем, что будет храниться в контексте
interface AuthContextType {
  token: string | null;
  login: (userData: TelegramUserData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const login = async (telegramUserData: TelegramUserData) => {
    try {
      const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(telegramUserData)
      });

      if (!response.ok) {
        throw new Error('Authentication failed!');
      }

      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
      }
    } catch (error) {
        console.error("Login error:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const value = { token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};