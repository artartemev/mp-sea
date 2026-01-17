// src/components/TelegramLoginButton.tsx

import React, { useEffect } from 'react';

// Предположим, у нас есть хук для управления аутентификацией
// import { useAuth } from '../context/AuthContext'; 

export const TelegramLoginButton = () => {
  // const { login } = useAuth(); // Получаем функцию логина из нашего контекста

  useEffect(() => {
    // Эта функция будет вызвана Telegram после успешной аутентификации
    window.onTelegramAuth = (user) => {
      // Здесь мы вызываем нашу функцию логина, передавая в нее данные от Telegram
      // login(user);
      console.log('Logged in with Telegram:', user);
    };
  }, []);

  // Сам виджет будет создан скриптом Telegram в том месте, где мы его разместим
  // Мы просто возвращаем пустой div, чтобы скрипт мог в него встроиться,
  // либо не возвращаем ничего, если скрипт добавлен в index.html
  return null; 
};