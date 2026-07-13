const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

export const bookingsService = {
  createBooking: async (data, token) => {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur lors de la réservation');
    return json;
  },

  getMyBookingsAsClient: async (token) => {
    const res = await fetch(`${API_URL}/bookings/mine/as-client`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur récupération de vos réservations');
    return json;
  },

  getMyBookingsAsWorker: async (token) => {
    const res = await fetch(`${API_URL}/bookings/mine/as-worker`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur récupération des réservations reçues');
    return json;
  },

  respondToBooking: async (id, accept, workerNote, token) => {
    const res = await fetch(`${API_URL}/bookings/${id}/respond`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ accept, workerNote }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur lors de la réponse');
    return json;
  },

  markBookingCompleted: async (id, token) => {
    const res = await fetch(`${API_URL}/bookings/${id}/complete`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur lors de la validation');
    return json;
  },
};