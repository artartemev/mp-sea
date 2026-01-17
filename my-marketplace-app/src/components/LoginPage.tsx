// src/components/LoginPage.tsx

import React, { useEffect, useRef } from 'react';
import { Flex, Text } from '@gravity-ui/uikit';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
    const { login } = useAuth();
    const telegramLoginRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // @ts-ignore
        window.onTelegramAuth = login;

        const script = document.createElement('script');
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.async = true;
        
        // Устанавливаем все необходимые атрибуты
        script.setAttribute('data-telegram-login', 'MarketPlace_Sea_bot'); // <-- Ваш юзернейм бота
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');

        telegramLoginRef.current?.appendChild(script);

        // Очистка при размонтировании компонента
        return () => {
            if (telegramLoginRef.current) {
                telegramLoginRef.current.innerHTML = '';
            }
        }
    }, [login]);


    return (
        <Flex
            direction="column"
            align="center"
            justify="center"
            style={{ minHeight: '100vh', textAlign: 'center' }}
        >
            <Text variant="header-2" paragraph>Добро пожаловать!</Text>
            <Text variant="body-1" paragraph>Пожалуйста, войдите через Telegram, чтобы продолжить.</Text>
            {/* Сюда будет вставлена кнопка Telegram */}
            <div ref={telegramLoginRef}></div>
        </Flex>
    );
};