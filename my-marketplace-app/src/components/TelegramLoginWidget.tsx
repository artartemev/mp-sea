// src/components/TelegramLoginWidget.tsx
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const TelegramLoginWidget = () => {
  const { login } = useAuth();

  useEffect(() => {
    // Привязываем нашу функцию логина к глобальной функции, которую вызывает Telegram
    // @ts-ignore
    window.onTelegramAuth = login;
  }, [login]);

  return null;
};