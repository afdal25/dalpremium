import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import DeferredToaster from "./components/DeferredToaster";
import './index.css'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <DeferredToaster />
  </React.StrictMode>,
)

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  const registerServiceWorker = () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(registerServiceWorker, {
      timeout: 3000,
    });
  } else {
    window.setTimeout(registerServiceWorker, 1500);
  }
}
