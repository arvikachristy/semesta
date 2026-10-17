import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { AccountProvider } from './account/account-provider';
import { BrowserRouter } from 'react-router';
import './styles/tokens.css';
import './style.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing React root element');
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AccountProvider>
        <App />
      </AccountProvider>
    </BrowserRouter>
  </StrictMode>,
);
