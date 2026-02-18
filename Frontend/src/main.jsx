import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './features/auth/AuthContext';
import { ConfirmProvider } from './shared/confirm/ConfirmContext';
import { NotificationProvider } from './shared/notifications/NotificationContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <ConfirmProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConfirmProvider>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
