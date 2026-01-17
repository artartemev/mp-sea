// src/components/ListingPage.tsx
import React, { useState, useEffect } from 'react';
import { Box, Card, Flex, Text, UserLabel, Button, Icon, Spin, Select } from '@gravity-ui/uikit';
import { useParams } from 'react-router-dom';
import { Flag } from '@gravity-ui/icons';

// Определяем типы данных, которые мы ожидаем от API
interface ListingImageAPI {
    id: string;
    url: string;
}

interface SellerAPI {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
}

interface Prices {
    USD: number;
    RUB: number;
    THB: number;
}

interface ListingAPI {
    id: string;
    title: string;
    description: string | null;
    prices: Prices;
    images: ListingImageAPI[];
    seller: SellerAPI;
}

const CURRENCY_SYMBOLS: { [key: string]: string } = {
    RUB: '₽',
    USD: '$',
    THB: '฿',
};

type Currency = 'RUB' | 'USD' | 'THB';

export const ListingPage = () => {
    const [listing, setListing] = useState<ListingAPI | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>('RUB');
    const { id } = useParams();

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const response = await fetch(`/api/listings/${id}`);
                if (!response.ok) throw new Error('Listing not found');
                const data = await response.json();
                setListing(data);
                if (data.images && data.images.length > 0) {
                    setSelectedImage(data.images[0].url);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchListing();
    }, [id]);

    if (isLoading) return <Flex justify="center" style={{padding: '80px 0'}}><Spin size="xl" /></Flex>;
    if (!listing) return <Text>Объявление не найдено.</Text>;

    return (
        <Box p={4} style={{ maxWidth: '1200px', margin: '40px auto' }}>
            <Flex gap={5} alignItems="flex-start">
                {/* Левая колонка: Галерея изображений */}
                <Flex direction="column" gap={3} style={{ flex: '2' }}>
                    <Box style={{
                        height: '500px',
                        background: '#fff',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '1px solid var(--g-color-line-generic)'
                    }}>
                        <img
                           src={selectedImage || 'https://via.placeholder.com/600x400.png?text=No+Image'}
                           alt={listing.title}
                           style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </Box>
                    <Flex gap={2} wrap="wrap">
                        {(listing.images || []).map(image => (
                            <Box
                                key={image.id}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: selectedImage === image.url ? '2px solid var(--g-color-base-accent)' : '2px solid transparent'
                                }}
                                onClick={() => setSelectedImage(image.url)}
                            >
                                <img src={image.url} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </Box>
                        ))}
                    </Flex>
                </Flex>

                {/* Правая колонка: Информация */}
                <Flex direction="column" gap={4} style={{ flex: '1', position: 'sticky', top: '20px' }}>
                    <Card theme="normal" type="container" size="l">
                        <Flex direction="column" gap={4} p={4}>
                            <Text variant="display-1">{listing.title}</Text>

                            <Flex gap={3} alignItems="center">
                                <Text variant="display-3" color="accent">
                                    {listing.prices ? `${Math.round(listing.prices[selectedCurrency])} ${CURRENCY_SYMBOLS[selectedCurrency]}` : 'Цена недоступна'}
                                </Text>
                                <Select
                                    value={[selectedCurrency]}
                                    onUpdate={(val) => setSelectedCurrency(val[0] as Currency)}
                                    size="l"
                                    width="auto"
                                >
                                    <Select.Option value="RUB">RUB</Select.Option>
                                    <Select.Option value="USD">USD</Select.Option>
                                    <Select.Option value="THB">THB</Select.Option>
                                </Select>
                            </Flex>

                            <Button view="action" size="xl" width="auto">Показать контакт</Button>
                        </Flex>
                    </Card>

                    <Card theme="normal" type="container" size="l">
                        <Flex direction="column" gap={3} p={4}>
                            <Text variant="header-2">Продавец</Text>
                            <UserLabel type="person" avatar={listing.seller?.avatar_url || ''} size="l">
                                {listing.seller?.full_name || 'Неизвестный продавец'}
                            </UserLabel>
                             <Button view="flat" size="m" width="auto">
                                <Icon data={Flag} /> Пожаловаться
                            </Button>
                        </Flex>
                    </Card>

                     <Card theme="normal" type="container" size="l">
                        <Flex direction="column" gap={3} p={4}>
                            <Text variant="header-2">Описание</Text>
                            <Text variant="body-2" style={{whiteSpace: 'pre-wrap'}}>{listing.description || 'Описания нет.'}</Text>
                        </Flex>
                    </Card>
                </Flex>
            </Flex>
        </Box>
    );
};