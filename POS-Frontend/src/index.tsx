
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import InvoicePublicView from './pages/InvoicePublicView';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/invoice/:id" element={<InvoicePublicView />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
