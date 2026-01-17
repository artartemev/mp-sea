// src/components/EditListingPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, Flex, TextInput, TextArea, Button, Text, Spin, Icon } from '@gravity-ui/uikit';
import { TrashBin } from '@gravity-ui/icons';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { ImageUploader } from './ImageUploader'; // Импортируем ImageUploader
import type { ListingImage } from '../types'; // Используем наш типизированный файл

export const EditListingPage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [files, setFiles] = useState<File[]>([]); // Для новых загружаемых файлов
    const [existingImages, setExistingImages] = useState<ListingImage[]>([]); // Для существующих изображений
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();
    const { listingId } = useParams<{ listingId: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchListingData = async () => {
            if (!listingId) return;
            setIsLoading(true);
            try {
                const response = await fetch(`/api/listings/${listingId}`);
                if (!response.ok) throw new Error('Listing not found or failed to fetch');
                const data = await response.json();
                setTitle(data.title);
                setDescription(data.description || '');
                setPrice(String(data.price));
                setExistingImages(data.images || []); // Загружаем существующие изображения
            } catch (error) {
                console.error("Failed to fetch listing data:", error);
                // Можно добавить уведомление для пользователя
            } finally {
                setIsLoading(false);
            }
        };
        fetchListingData();
    }, [listingId]);

    const uploadNewImages = async () => {
        if (!listingId || files.length === 0) return;

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await fetch(`/api/listings/${listingId}/upload-image`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
                if (!response.ok) {
                    console.error(`Failed to upload image ${file.name}`);
                    // Можно добавить обработку ошибок для каждого файла
                }
            } catch (error) {
                console.error(`Error uploading image ${file.name}:`, error);
            }
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!listingId) return;

        const listingData = { title, description, price: parseFloat(price) || 0 };

        try {
            // 1. Обновляем текстовые данные объявления
            const response = await fetch(`/api/listings/${listingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(listingData)
            });
            if (!response.ok) throw new Error('Failed to update listing text data');

            // 2. Загружаем новые картинки, если есть
            if (files.length > 0) {
                await uploadNewImages();
            }
            
            alert('Объявление успешно обновлено!');
            navigate('/dashboard/listings'); // Возвращаемся к списку
        } catch (error) {
            console.error("Failed to update listing:", error);
            alert('Произошла ошибка при обновлении объявления');
        }
    };

    const handleDeleteExistingImage = async (imageId: string) => {
        if (!listingId || !token) {
            alert('Ошибка: ID объявления или токен отсутствуют.');
            return;
        }

        if (!window.confirm('Вы уверены, что хотите удалить это изображение?')) {
            return;
        }

        try {
            const response = await fetch(`/api/listings/${listingId}/images/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                // Попытка прочитать тело ошибки, если есть
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || 'Не удалось удалить изображение');
            }

            // Обновляем состояние, удаляя изображение из списка
            setExistingImages(prevImages => prevImages.filter(image => image.id !== imageId));
            alert('Изображение успешно удалено.');

        } catch (error) {
            console.error('Ошибка при удалении изображения:', error);
            alert(`Произошла ошибка: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    if (isLoading && !existingImages.length) { // Показываем спиннер только при начальной загрузке
        return <Flex justify="center" style={{ paddingTop: '20px' }}><Spin size="xl" /></Flex>;
    }

    return (
        <Card theme="normal" type="container" size="l">
            <form onSubmit={handleSubmit}>
                <Flex direction="column" space={5} p={4}>
                    <Text variant="header-2">Редактирование объявления</Text>

                    {/* Отображение существующих изображений */}
                    {existingImages.length > 0 && (
                        <Flex direction="column" space={3} mb={4}>
                            <Text variant="subheader-1">Текущие изображения</Text>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
                                {existingImages.map(image => (
                                    <div key={image.id} style={{ position: 'relative', border: '1px solid var(--g-color-line-generic)', borderRadius: '8px', overflow: 'hidden' }}>
                                        <img src={image.url} alt="Existing listing" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                                        <Button
                                            view="flat-danger"
                                            style={{ position: 'absolute', top: '4px', right: '4px', zIndex: 1 }}
                                            onClick={() => handleDeleteExistingImage(image.id)}
                                            title="Удалить изображение"
                                        >
                                             <Icon data={TrashBin}/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Flex>
                    )}

                    {/* Компонент для загрузки новых изображений */}
                    <ImageUploader files={files} onFilesChange={setFiles} />

                    <TextInput size="l" label="Название:" value={title} onUpdate={setTitle} required />
                    <TextArea size="l" label="Описание:" value={description} onUpdate={setDescription} rows={6} />
                    <TextInput size="l" label="Цена ($):" value={price} onUpdate={setPrice} type="number" required />
                    <Button type="submit" view="action" size="l" loading={isLoading}>Сохранить изменения</Button>
                </Flex>
            </form>
        </Card>
    );
};
