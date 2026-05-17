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
