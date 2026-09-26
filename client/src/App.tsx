import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
