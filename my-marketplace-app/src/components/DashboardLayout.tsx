// src/components/DashboardLayout.tsx
import React from 'react';
import { Box, Card, Flex, List, Text, Icon } from '@gravity-ui/uikit';
import { Gear, ListUl, ArrowRightFromSquare } from '@gravity-ui/icons';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
    { value: 'my-items', path: '/dashboard/listings', title: 'Мои объявления', icon: <Icon data={ListUl} /> },
    { value: 'settings', path: '/dashboard/settings', title: 'Настройки', icon: <Icon data={Gear} /> },
];

export const DashboardLayout = ({ children, title }: { children: React.ReactNode, title: string }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const activeItemIndex = menuItems.findIndex(item => location.pathname.startsWith(item.path));

  return (
    <Box p={4} style={{ maxWidth: '1200px', margin: '40px auto' }}>
      <Flex gap={5} alignItems="flex-start">
        {/* Навигация */}
        <Box style={{ flex: '0 0 250px', position: 'sticky', top: '20px' }}>
          <Card theme="normal" type="container" size="l" style={{ padding: '8px 0' }}>
            <List
              items={menuItems}
              activeItemIndex={activeItemIndex}
              renderItem={(item) => (
                <Link to={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Flex
                        space={2}
                        align="center"
                        style={{
                            padding: '12px 20px',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            margin: '4px 8px',
                            background: menuItems[activeItemIndex]?.value === item.value ? 'var(--g-color-base-simple-hover)' : 'transparent',
                        }}
                    >
                        {item.icon}
                        <Text variant="body-2">{item.title}</Text>
                    </Flex>
                </Link>
              )}
              itemHeight={52}
            />
            {/* Кнопка выхода */}
            <Box mt={2} style={{borderTop: '1px solid var(--g-color-line-generic)', padding: '8px'}}>
                <Flex onClick={logout} space={2} align="center" style={{padding: '12px 20px', cursor: 'pointer'}}>
                    <Icon data={ArrowRightFromSquare} />
                    <Text color="danger">Выйти</Text>
                </Flex>
            </Box>
          </Card>
        </Box>

        {/* Основное содержимое */}
        <Box style={{ flex: '1' }}>
            <Text variant="display-2" as="h1">{title}</Text>
            {children}
        </Box>
      </Flex>
    </Box>
  );
};