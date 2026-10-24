import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { AccountProvider } from './account/account-provider';
import { BrowserRouter } from 'react-router';
import { Provider } from 'react-redux';
import { store } from './app/store';
import '@fontsource/farro/300.css';
import '@fontsource/farro/400.css';
import '@fontsource/farro/500.css';
import '@fontsource/farro/700.css';
import './styles/tokens.css';
import './style.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing React root element');
}

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AccountProvider>
          <App />
        </AccountProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
