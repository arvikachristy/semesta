import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { AccountProvider } from './account/account-provider';
import { BrowserRouter } from 'react-router';
import { Provider } from 'react-redux';
import { store } from './app/store';
import '@fontsource/lora/400.css';
import '@fontsource/lora/500.css';
import '@fontsource/work-sans/400.css';
import '@fontsource/work-sans/500.css';
import '@fontsource/work-sans/600.css';
import '@fontsource/work-sans/700.css';
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
