// src/components/CatalogPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Flex, Text, Spin, Select } from '@gravity-ui/uikit';
import { motion, AnimatePresence } from 'framer-motion';
import { Filters } from './Filters';
import type { FilterValues } from './Filters';
import { ItemCard } from './ItemCard';
import type { ListingPublic } from '../types';

const defaultFilters: FilterValues = {
    q: '',
    category: '',
    max_price: '',
    sort_by: 'date_desc',
};

type Currency = 'RUB' | 'USD' | 'THB';

export const CatalogPage = () => {
    const [listings, setListings] = useState<ListingPublic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentFilters, setCurrentFilters] = useState<FilterValues>(defaultFilters);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>('RUB');


    const fetchListingsData = useCallback(async (filters: FilterValues) => {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.q) params.append('q', filters.q);
        if (filters.category) params.append('category', filters.category);
        if (filters.max_price) params.append('max_price', filters.max_price);
        if (filters.sort_by) params.append('sort_by', filters.sort_by);

        try {
            const response = await fetch(`/api/listings?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Не удалось загрузить объявления' }));
                throw new Error(errorData.detail || 'Не удалось загрузить объявления');
            }
            const data: ListingPublic[] = await response.json();
            setListings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchListingsData(currentFilters);
    }, [fetchListingsData, currentFilters]);

    const handleApplyFilters = (newFilters: FilterValues) => {
        setCurrentFilters(newFilters);
    };

    const renderContent = () => {
        if (isLoading) {
            return <Flex justify="center" align="center" style={{ height: '50vh' }}><Spin size="xl" /></Flex>;
        }
        if (error) {
            return <Flex justify="center" align="center" style={{ height: '50vh' }}><Text color="danger">{error}</Text></Flex>;
        }
        if (listings.length === 0) {
            return <Flex justify="center" align="center" style={{ height: '50vh' }}><Text>Объявления не найдены.</Text></Flex>;
        }
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '24px',
                }}
            >
                {listings.map((item) => (
                    <ItemCard
                        key={item.id}
                        currency={selectedCurrency}
                        item={{
                            id: item.id,
                            title: item.title,
                            prices: item.prices,
                            main_image_url: item.main_image_url || 'https://via.placeholder.com/300x180.png?text=No+Image',
                        }}
                    />
                ))}
            </motion.div>
        );
    };

    return (
        <Box p={4} style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <Text variant="display-1" as="h1" pb={4}>Каталог товаров</Text>
            <Flex gap={5} alignItems="flex-start">
                <Box style={{ flex: '0 0 300px', position: 'sticky', top: '20px' }}>
                    <Filters
                        onApplyFilters={handleApplyFilters}
                        initialFilters={currentFilters}
                    />
                </Box>
                <Box style={{ flex: '1', minWidth: 0 }}>
                    <AnimatePresence mode="wait">
                        <Flex justifyContent="flex-end" mb={3}>
                             <Select
                                value={[selectedCurrency]}
                                onUpdate={(val) => setSelectedCurrency(val[0] as Currency)}
                                size="m"
                                width="auto"
                            >
                                <Select.Option value="RUB">RUB</Select.Option>
                                <Select.Option value="USD">USD</Select.Option>
                                <Select.Option value="THB">THB</Select.Option>
                            </Select>
                        </Flex>
                        <motion.div key={JSON.stringify(currentFilters)}>
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </Box>
            </Flex>
        </Box>
    );
};
