// src/components/UserProfilePage.tsx

import { Box, Card, Flex, Text, UserLabel } from '@gravity-ui/uikit';
import { ItemCard, type Item } from './ItemCard';

// Mock-данные для пользователя и его товаров
const mockUser = {
  name: 'Иван Петров',
  avatarUrl: 'https://i.pravatar.cc/150?u=ivan',
  successfulDeals: 5,
  memberSince: 'Май 2025',
};

const mockUserItems: Item[] = [
  { id: '1', title: 'Apple iPhone 13 64gb Black', price: '500 $', imageUrl: 'https://via.placeholder.com/300x180.png?text=iPhone' },
  { id: '3', title: 'Кресло из ротанга', price: '50 $', imageUrl: 'https://via.placeholder.com/300x180.png?text=Chair' },
  { id: '6', title: 'Кофемашина DeLonghi', price: '80 $', imageUrl: 'https://via.placeholder.com/300x180.png?text=Coffee' },
];

export const UserProfilePage = () => {
  return (
    <Box p={4} style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <Flex gap={5} direction="column">
        {/* --- 1. Шапка профиля --- */}
        <Card theme="normal" type="container" size="l">
          <Flex p={4} space={4} alignItems="center">
            <UserLabel
              type="person"
              avatar={mockUser.avatarUrl}
              size="xl" // Увеличим размер для заголовка
            >
              <Text variant="header-2">{mockUser.name}</Text>
            </UserLabel>
            <Flex direction="column">
                <Text color="secondary">Удачных сделок: {mockUser.successfulDeals}</Text>
                <Text color="secondary">На сайте с {mockUser.memberSince}</Text>
            </Flex>
          </Flex>
        </Card>

        {/* --- 2. Галерея объявлений --- */}
        <Box>
          <Text variant="header-2" as="h2" pb={4}>
            Активные объявления пользователя
          </Text>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {mockUserItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </Box>
      </Flex>
    </Box>
  );
};