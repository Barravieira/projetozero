import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRoutes from './routes/AppRoutes.jsx'
import { AuthProvider } from './hooks/useAuth';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './styles/index.css'
import 'dayjs/locale/pt-br';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider>
      <DatesProvider settings={{ firstDayOfWeek: 0, locale: 'pt-br' }}>
        <Notifications position="top-center" zIndex={1000} />
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
)
