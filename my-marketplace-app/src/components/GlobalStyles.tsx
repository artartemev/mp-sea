// src/components/GlobalStyles.tsx
import { themeCSS } from '../theme';

export const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
);