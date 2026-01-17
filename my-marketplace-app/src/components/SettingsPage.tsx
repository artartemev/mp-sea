// src/components/SettingsPage.tsx

import {
    Box,
    Card,
    Flex,
    Text,
    TextInput,
    TextArea,
    Button,
    User,
  } from '@gravity-ui/uikit';
  
  const mockUserSettings = {
    name: 'Иван Петров',
    telegram: 'ivan_petrov_tg',
    avatarUrl: 'https://i.pravatar.cc/150?u=ivan',
  };
  
  export const SettingsPage = () => {
    return (
      <Card theme="normal" type="container" size="l">
        <Flex direction="column" space={5} p={4}>
          <Flex direction="column" space={2}>
            <Text color="secondary">Ваш аватар</Text>
            <User
              avatar={mockUserSettings.avatarUrl}
              name={mockUserSettings.name}
              description={`Telegram: @${mockUserSettings.telegram}`}
              size="xl"
            />
            {/* В будущем здесь будет кнопка для смены аватара */}
          </Flex>
  
          <TextInput
            size="l"
            label="Ваше имя:"
            defaultValue={mockUserSettings.name}
          />
  
          <TextArea
            size="l"
            label="Коротко о себе (будет видно в профиле):"
            placeholder="Например: занимаюсь веб-дизайном, живу в Убуде"
            rows={4}
          />
  
          <Flex>
            <Button view="action" size="l">
              Сохранить изменения
            </Button>
          </Flex>
        </Flex>
      </Card>
    );
  };