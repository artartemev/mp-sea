// src/App.tsx
import { ThemeProvider } from '@gravity-ui/uikit';
import { AuthProvider } from './context/AuthContext';
import { AppRouter } from './components/AppRouter'; // Вынесем роутинг в отдельный компонент
import { GlobalStyles } from './components/GlobalStyles';
import { marketplaceTheme } from './theme';

import '@gravity-ui/uikit/styles/styles.css';
import '@gravity-ui/uikit/styles/fonts.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={marketplaceTheme}>
        <GlobalStyles />
        <AppRouter />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
