import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {BrowserRouter} from "react-router-dom";
import {ThemeProvider} from "./context/ThemeContext.jsx";
import {CartProvider} from "./context/CartContext.jsx";
import {AuthProvider} from "./context/AuthContext.jsx";
import App from "./App.jsx";

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
      <ThemeProvider>
          <AuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
          </AuthProvider>
      </ThemeProvider>
  </BrowserRouter>
)
