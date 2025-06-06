import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRoutes from './routes/AppRoutes.jsx'
import { AuthProvider } from './hooks/useAuth';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider>
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    </MantineProvider>
  </StrictMode>,
)
