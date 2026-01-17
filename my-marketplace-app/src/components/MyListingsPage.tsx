// src/components/MyListingsPage.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Text, Box, Flex, Icon } from '@gravity-ui/uikit';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, TrashBin } from '@gravity-ui/icons';

interface Listing {
  id: string;
  title: string;
  price: number;
}

export const MyListingsPage = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchListings = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/me/listings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch listings');
      const data = await response.json();
      setListings(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [token]);

  const handleDelete = async (listingId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить это объявление?')) {
      try {
        const response = await fetch(`/api/listings/${listingId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete listing');
        // Обновляем список после удаления
        fetchListings();
      } catch (error) {
        console.error(error);
        alert('Ошибка при удалении');
      }
    }
  };

  const columns = [
    { id: 'title', name: 'Название' },
    { id: 'price', name: 'Цена' },
    { id: 'actions', name: 'Действия', align: 'right' as const },
  ];

  return (
    <Flex direction="column" gap={4}>
      <Flex justify="end">
        <Link to="/dashboard/listings/new">
          <Button view="action" size="l">Создать объявление</Button>
        </Link>
      </Flex>
      <Table
        data={listings}
        columns={columns.map(c => ({
          ...c,
          template: (item: Listing) => {
            switch (c.id) {
              case 'title':
                return <Text>{item.title}</Text>;
              case 'price':
                return <Text>{item.price} $</Text>;
              case 'actions':
                return (
                  <Flex gap={2} justify="end">
                    <Button onClick={() => navigate(`/dashboard/listings/edit/${item.id}`)}>
                      <Icon data={Pencil} />
                    </Button>
                    <Button view="outlined-danger" onClick={() => handleDelete(item.id)}>
                      <Icon data={TrashBin} />
                    </Button>
                  </Flex>
                );
              default:
                return null;
            }
          }
        }))}
      />
    </Flex>
  );
};
