// src/components/HomePage.tsx
import { Box, Flex, Text, TextInput, Button, Spin } from '@gravity-ui/uikit';
import { ItemCard } from './ItemCard';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react'; // <--- Добавлен useEffect
import type { ListingPublic } from '../types'; // <--- Импортируем тип объявления

// Старый mockItems больше не нужен

const categories = [
    {id: 'electronics', name: 'Электроника'}, {id: 'transport', name: 'Транспорт'},
    {id: 'furniture', name: 'Мебель'}, {id: 'realty', name: 'Недвижимость'},
    {id: 'services', name: 'Услуги'}, {id: 'clothing', name: 'Одежда'},
];

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // --- НАЧАЛО ИЗМЕНЕНИЙ ---

  // 1. Состояние для хранения объявлений с сервера и статуса загрузки
  const [latestListings, setLatestListings] = useState<ListingPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Загрузка данных при первом отображении компонента
  useEffect(() => {
    const fetchLatestListings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/listings?limit=8&sort_by=date_desc');
        if (!response.ok) {
          throw new Error('Не удалось загрузить объявления');
        }
        const data = await response.json();
        setLatestListings(data);
      } catch (error) {
        console.error("Ошибка при загрузке последних объявлений:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLatestListings();
  }, []); // Пустой массив зависимостей = выполнить один раз

  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchTerm.trim())}`); // Исправлен параметр на 'q'
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
        <Box py={10} style={{ background: 'var(--g-color-base-generic)' }}>
          <Flex direction="column" gap={5} style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
            <Text variant="display-3" as="h1" color="primary">
              Вся барахолка в одном месте
            </Text>
            <Text variant="body-3" color="secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
              Найдите то, что вам нужно, среди сотен предложений от русскоязычных экспатов в Юго-Восточной Азии, Сербии и Грузии.
            </Text>
            <Flex pt={4} style={{ width: '100%', maxWidth: '700px', margin: '0 auto' }} gap={2} as="form" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <TextInput
                size="xl"
                placeholder="Что вы ищете?"
                value={searchTerm}
                onUpdate={setSearchTerm} // Изменено на onUpdate для Gravity UI
                hasClear
                style={{ flexGrow: 1 }}
              />
              <Button view="action" size="xl" type="submit">Найти</Button>
            </Flex>
          </Flex>
        </Box>
      </motion.div>

      {/* Categories Section */}
      <motion.div initial="hidden" animate="visible" variants={{ ...sectionVariants, visible: { ...sectionVariants.visible, transition: { delay: 0.2, duration: 0.5 } } }}>
        <Box py={6} style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <Text variant="header-2" as="h2" pb={4}>Популярные категории</Text>
          <Flex wrap="wrap" gap={2}>
            {categories.map(cat => (
              <Link to={`/catalog?category=${cat.id}`} key={cat.id} style={{ textDecoration: 'none' }}>
                <Button view="outlined" size="l">{cat.name}</Button>
              </Link>
            ))}
          </Flex>
        </Box>
      </motion.div>
      
      {/* Latest Items Section */}
      <motion.div initial="hidden" animate="visible" variants={{ ...sectionVariants, visible: { ...sectionVariants.visible, transition: { delay: 0.4, duration: 0.5 } } }}>
        <Box py={6} style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <Flex justify="between" align="center" pb={4}>
            <Text variant="header-2" as="h2">Последние объявления</Text>
            <Link to="/catalog" style={{ textDecoration: 'none' }}>
              <Button view="flat-secondary">Смотреть все</Button>
            </Link>
          </Flex>
          
          {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
          {/* 3. Вместо mockItems показываем либо загрузчик, либо реальные данные */}
          {isLoading ? (
            <Flex justify="center" style={{ minHeight: '200px', alignItems: 'center' }}>
              <Spin size="xl" />
            </Flex>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {latestListings.map((item) => (
                <ItemCard 
                  key={item.id} 
                  item={{
                    id: item.id,
                    title: item.title,
                    price: `${item.price}`, // API отдает число, преобразуем в строку
                    imageUrl: item.main_image_url || 'https://via.placeholder.com/300x180.png?text=No+Image',
                  }} 
                />
              ))}
            </div>
          )}
          {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

        </Box>
      </motion.div>
    </Box>
  );
};
