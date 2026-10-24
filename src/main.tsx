import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { AccountProvider } from './account/account-provider';
import { BrowserRouter } from 'react-router';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { applyTheme } from './styles/theme';
import './styles/tokens.css';
import './styles/themes/rose.css';
import './styles/themes/midnight.css';
import './style.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing React root element');
}

applyTheme(store.getState().theme.current);

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
