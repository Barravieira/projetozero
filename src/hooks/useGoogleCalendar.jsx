import { useState, useEffect, useContext, createContext } from 'react';
import { notifications } from '@mantine/notifications';
import * as googleCalendarService from '../services/googleCalendar';

const GoogleCalendarContext = createContext();

export function GoogleCalendarProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [calendarClient, setCalendarClient] = useState(null);
  const [loading, setLoading] = useState(false);

  const setToken = (token) => {
    localStorage.setItem('google_calendar_token', token);
    setAccessToken(token);
    setCalendarClient(googleCalendarService.initGoogleCalendar(token));
    setIsConnected(true);
  };

  useEffect(() => {
    // Verificar se há token salvo no localStorage
    const savedToken = localStorage.getItem('google_calendar_token');
    if (savedToken) {
      setToken(savedToken);
    }

    // Verificar se há token na URL (callback do OAuth)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setToken(accessToken);
        // Limpar a URL
        window.history.replaceState({}, document.title, window.location.pathname);
        notifications.show({
          title: 'Conectado',
          message: 'Conectado ao Google Calendar com sucesso!',
          color: 'green',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async () => {
    try {
      // Para produção, você precisará implementar o fluxo OAuth 2.0 completo
      // Por enquanto, esta é uma estrutura básica
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        notifications.show({
          title: 'Configuração necessária',
          message: 'Configure VITE_GOOGLE_CLIENT_ID no arquivo .env',
          color: 'yellow',
        });
        return;
      }

      // Redirecionar para autenticação OAuth
      const redirectUri = window.location.origin + '/app';
      const scope = 'https://www.googleapis.com/auth/calendar';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&access_type=offline`;

      window.location.href = authUrl;
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao conectar com Google Calendar: ' + error.message,
        color: 'red',
      });
    }
  };

  const disconnect = () => {
    localStorage.removeItem('google_calendar_token');
    setAccessToken(null);
    setCalendarClient(null);
    setIsConnected(false);
    notifications.show({
      title: 'Desconectado',
      message: 'Desconectado do Google Calendar com sucesso.',
      color: 'green',
    });
  };

  return (
    <GoogleCalendarContext.Provider
      value={{
        isConnected,
        calendarClient,
        connect,
        disconnect,
        setToken,
        loading,
      }}
    >
      {children}
    </GoogleCalendarContext.Provider>
  );
}

export function useGoogleCalendar() {
  const context = useContext(GoogleCalendarContext);
  if (!context) {
    // Retornar valores padrão ao invés de lançar erro
    console.warn('useGoogleCalendar deve ser usado dentro de GoogleCalendarProvider');
    return {
      isConnected: false,
      calendarClient: null,
      connect: () => {},
      disconnect: () => {},
      setToken: () => {},
      loading: false,
    };
  }
  return context;
}

