// src/components/SubscriptionsPage.tsx

import { Card, Flex, Text, Button, Icon, List } from '@gravity-ui/uikit';
import { TrashBin } from '@gravity-ui/icons';

const mockSubscriptions = [
  { id: '1', query: 'iPhone 14 Pro Max' },
  { id: '2', query: 'Скутер в районе Чангу' },
  { id: '3', query: 'Детская коляска' },
];

export const SubscriptionsPage = () => {
  return (
    <Card theme="normal" type="container" size="l">
      <List
        items={mockSubscriptions}
        renderItem={(item) => (
          <Flex
            key={item.id}
            justify="space-between"
            align="center"
            style={{ padding: '12px 16px', borderBottom: '1px solid var(--g-color-line-generic)'}}
          >
            <Text variant="body-2">{item.query}</Text>
            <Button view="flat-danger" size="s">
              <Icon data={TrashBin} />
              Удалить
            </Button>
          </Flex>
        )}
        itemHeight={50} // Приблизительная высота элемента
      />
    </Card>
  );
};