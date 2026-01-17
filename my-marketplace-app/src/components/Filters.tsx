// src/components/Filters.tsx
import React, { useState } from 'react';
import { Card, Flex, TextInput, Select, Button, Text } from '@gravity-ui/uikit';

export interface FilterValues {
    q: string;
    category: string;
    max_price: string;
    sort_by: string;
}

interface FiltersProps {
    onApplyFilters: (filters: FilterValues) => void;
    initialFilters: FilterValues;
    categories?: { value: string; content: string }[];
}

const sortOptions = [
    { value: 'date_desc', content: 'Сначала новые' },
    { value: 'date_asc', content: 'Сначала старые' },
    { value: 'price_asc', content: 'Цена: по возрастанию' },
    { value: 'price_desc', content: 'Цена: по убыванию' },
];

const defaultCategories = [
    { value: '', content: 'Все категории' },
    { value: 'electronics', content: 'Электроника' },
    { value: 'clothing', content: 'Одежда' },
    { value: 'books', content: 'Книги' },
    { value: 'home-goods', content: 'Товары для дома' },
    { value: 'sports', content: 'Спорт и отдых' },
    { value: 'other', content: 'Разное' },
];

export const Filters = ({ onApplyFilters, initialFilters, categories = defaultCategories }: FiltersProps) => {
    const [searchTerm, setSearchTerm] = useState(initialFilters.q);
    const [selectedCategory, setSelectedCategory] = useState<string[]>([initialFilters.category]);
    const [maxPrice, setMaxPrice] = useState(initialFilters.max_price);
    const [sortBy, setSortBy] = useState<string[]>([initialFilters.sort_by]);

    const handleApply = () => {
        onApplyFilters({
            q: searchTerm,
            category: selectedCategory[0] || '',
            max_price: maxPrice,
            sort_by: sortBy[0] || 'date_desc',
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedCategory(['']);
        setMaxPrice('');
        setSortBy(['date_desc']);
        onApplyFilters({
            q: '',
            category: '',
            max_price: '',
            sort_by: 'date_desc',
        });
    };

    return (
        <Card view="outlined" style={{ padding: '24px' }}>
            <Flex direction="column" gap={5}>
                <Text variant="subheader-2" as="h3">Фильтры</Text>

                <TextInput
                    label="Поиск:"
                    placeholder="Название или описание"
                    value={searchTerm}
                    onUpdate={setSearchTerm}
                    size="l"
                    hasClear
                />

                <Select
                    label="Категория:"
                    options={categories}
                    value={selectedCategory}
                    onUpdate={setSelectedCategory}
                    size="l"
                />

                <TextInput
                    label="Макс. цена ($):"
                    value={maxPrice}
                    onUpdate={setMaxPrice}
                    type="number"
                    size="l"
                    min="0"
                />

                <Select
                    label="Сортировка:"
                    options={sortOptions}
                    value={sortBy}
                    onUpdate={setSortBy}
                    size="l"
                />

                <Flex gap={2} style={{ marginTop: '16px' }}>
                    <Button onClick={handleReset} view="normal" size="l" style={{ flex: 1 }}>Сбросить</Button>
                    <Button onClick={handleApply} view="action" size="l" style={{ flex: 1 }}>Применить</Button>
                </Flex>
            </Flex>
        </Card>
    );
};