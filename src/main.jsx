import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { BrandAuthProvider } from './contexts/BrandAuthContext'
import { CartProvider } from './contexts/CartContext'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BrandAuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </BrandAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

