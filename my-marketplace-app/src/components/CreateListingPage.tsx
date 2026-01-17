// src/components/CreateListingPage.tsx
import React, { useState } from 'react';
import { Card, Flex, TextInput, TextArea, Button, Text } from '@gravity-ui/uikit';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ImageUploader } from './ImageUploader';

export const CreateListingPage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [files, setFiles] = useState<File[]>([]); // Состояние для файлов
    const { token } = useAuth();
    const navigate = useNavigate();

    const uploadImages = async (listingId: string) => {
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            await fetch(`/api/listings/${listingId}/upload-image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const listingData = { title, description, price: parseFloat(price) || 0 };

        try {
            // 1. Создаем объявление с текстом
            const response = await fetch('/api/listings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(listingData)
            });
            if (!response.ok) throw new Error('Failed to create listing');
            const createdListing = await response.json();

            // 2. Загружаем картинки
            if (files.length > 0) {
                await uploadImages(createdListing.id);
            }
            
            alert(`Объявление "${createdListing.title}" успешно создано!`);
            navigate('/dashboard/listings');
        } catch (error) {
            console.error(error);
            alert('Произошла ошибка при создании объявления');
        }
    };

    return (
        <Card theme="normal" type="container" size="l">
            <form onSubmit={handleSubmit}>
                <Flex direction="column" space={5} p={4}>
                    <Text variant="header-2">Новое объявление</Text>
                    <ImageUploader files={files} onFilesChange={setFiles} />
                    <TextInput size="l" label="Название:" value={title} onUpdate={setTitle} required />
                    <TextArea size="l" label="Описание:" value={description} onUpdate={setDescription} rows={6} />
                    <TextInput size="l" label="Цена ($):" value={price} onUpdate={setPrice} type="number" required />
                    <Button type="submit" view="action" size="l">Опубликовать</Button>
                </Flex>
            </form>
        </Card>
    );
};
