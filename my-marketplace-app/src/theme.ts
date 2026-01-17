// src/theme.ts

// Тип Theme не всегда экспортируется, поэтому мы можем просто использовать строку.
export const marketplaceTheme = 'light'; // Мы будем использовать светлую тему как основу

// Глобальные CSS переменные для нашей кастомной темы
export const themeCSS = `
  :root {
    /* Новый акцентный цвет - спокойный синий */
    --g-color-text-accent: #3B82F6;
    --g-color-text-accent-hover: #2563EB;
    --g-color-base-accent: #3B82F6;
    --g-color-base-accent-hover: #2563EB;

    /* Цвета для акцентной кнопки */
    --g-color-text-primary: #ffffff;
    --g-color-text-primary-hover: #ffffff;
    --g-color-base-primary: #3B82F6;
    --g-color-base-primary-hover: #2563EB;

    /* Основной фон */
    --g-color-base-background: #F9FAFB; /* Сделаем фон чуть-чуть серым для глубины */

    /* Цвета текста */
    --g-color-text-primary: #1F2937; /* Для заголовков */
    --g-color-text-secondary: #4B5563; /* Для основного текста */
    --g-color-text-hint: #9CA3AF; /* Для подсказок и второстепенного текста */

    /* Другие переменные для консистентности */
    --g-color-base-generic: #F3F4F6; /* Фон для инпутов и других элементов */
    --g-color-line-generic: #D1D5DB; /* Цвет границ */

  }

  /* Используем Inter как основной шрифт */
  body, .g-text {
    font-family: "Inter", "YS Text", "Helvetica", "Arial", sans-serif;
  }

  /* Добавим плавности для переходов */
  * {
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out, border-color 0.2s ease-in-out;
  }
`;