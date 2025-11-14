// Serviço para integração com Google Calendar API
// Requer configuração OAuth 2.0 no Google Cloud Console

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

/**
 * Inicializa o cliente do Google Calendar
 * @param {string} accessToken - Token de acesso OAuth 2.0
 */
export function initGoogleCalendar(accessToken) {
  return {
    accessToken,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Busca eventos do Google Calendar
 * @param {Object} client - Cliente do Google Calendar
 * @param {Date} timeMin - Data/hora mínima
 * @param {Date} timeMax - Data/hora máxima
 * @param {string} calendarId - ID do calendário (default: 'primary')
 */
export async function fetchGoogleCalendarEvents(client, timeMin, timeMax, calendarId = 'primary') {
  try {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events?${params}`,
      {
        headers: client.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar eventos: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Erro ao buscar eventos do Google Calendar:', error);
    throw error;
  }
}

/**
 * Cria um evento no Google Calendar
 * @param {Object} client - Cliente do Google Calendar
 * @param {Object} eventData - Dados do evento
 * @param {string} calendarId - ID do calendário (default: 'primary')
 */
export async function createGoogleCalendarEvent(client, eventData, calendarId = 'primary') {
  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: client.headers,
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao criar evento: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar evento no Google Calendar:', error);
    throw error;
  }
}

/**
 * Atualiza um evento no Google Calendar
 * @param {Object} client - Cliente do Google Calendar
 * @param {string} eventId - ID do evento
 * @param {Object} eventData - Dados atualizados do evento
 * @param {string} calendarId - ID do calendário (default: 'primary')
 */
export async function updateGoogleCalendarEvent(client, eventId, eventData, calendarId = 'primary') {
  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'PUT',
        headers: client.headers,
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao atualizar evento: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao atualizar evento no Google Calendar:', error);
    throw error;
  }
}

/**
 * Deleta um evento do Google Calendar
 * @param {Object} client - Cliente do Google Calendar
 * @param {string} eventId - ID do evento
 * @param {string} calendarId - ID do calendário (default: 'primary')
 */
export async function deleteGoogleCalendarEvent(client, eventId, calendarId = 'primary') {
  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: client.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao deletar evento: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar evento do Google Calendar:', error);
    throw error;
  }
}

/**
 * Lista os calendários do usuário
 * @param {Object} client - Cliente do Google Calendar
 */
export async function listGoogleCalendars(client) {
  try {
    const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
      headers: client.headers,
    });

    if (!response.ok) {
      throw new Error(`Erro ao listar calendários: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Erro ao listar calendários:', error);
    throw error;
  }
}

