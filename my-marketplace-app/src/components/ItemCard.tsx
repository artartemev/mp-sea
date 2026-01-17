// src/components/ItemCard.tsx
import { Card, Text, Flex } from '@gravity-ui/uikit';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CURRENCY_SYMBOLS: { [key: string]: string } = {
    RUB: '₽',
    USD: '$',
    THB: '฿',
};

type Currency = 'RUB' | 'USD' | 'THB';

interface Prices {
    USD: number;
    RUB: number;
    THB: number;
}

export type Item = {
  id: string;
  title: string;
  prices: Prices;
  main_image_url: string;
};

type ItemCardProps = {
  item: Item;
  currency: Currency;
};

export const ItemCard = ({ item, currency }: ItemCardProps) => {
  // Defensive check for prices
  const price = item.prices ? Math.round(item.prices[currency]) : null;
  const symbol = item.prices ? CURRENCY_SYMBOLS[currency] : '';

  return (
    <Link to={`/item/${item.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <motion.div
        whileHover={{ y: -5, scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 300 }}
        style={{ height: '100%' }}
      >
        <Card
          view="outlined"
          style={{
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <img
            src={item.main_image_url}
            alt={item.title}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
            }}
          />
          <Flex direction="column" space={2} p={3} style={{ flexGrow: 1, justifyContent: 'space-between' }}>
            <Text variant="body-2" color="secondary" ellipsis>
              {item.title}
            </Text>
            <Text variant="header-2" color="primary">
              {price !== null ? `${price} ${symbol}` : 'Цена недоступна'}
            </Text>
          </Flex>
        </Card>
      </motion.div>
    </Link>
  );
};