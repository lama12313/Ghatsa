import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/reem-kufi/500.css';
import '@fontsource/reem-kufi/700.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
