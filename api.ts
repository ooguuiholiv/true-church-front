
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
    members: {
        getAll: async () => {
            const resp = await fetch(`${API_URL}/members`);
            return resp.json();
        },
        create: async (data: any) => {
            const isFormData = data instanceof FormData;
            const resp = await fetch(`${API_URL}/members`, {
                method: 'POST',
                headers: isFormData ? {} : { 'Content-Type': 'application/json' },
                body: isFormData ? data : JSON.stringify(data),
            });
            return resp.json();
        },
        update: async (id: string, data: any) => {
            const isFormData = data instanceof FormData;
            const resp = await fetch(`${API_URL}/members/${id}`, {
                method: 'PUT',
                headers: isFormData ? {} : { 'Content-Type': 'application/json' },
                body: isFormData ? data : JSON.stringify(data),
            });
            return resp.json();
        },
        delete: async (id: string) => {
            await fetch(`${API_URL}/members/${id}`, { method: 'DELETE' });
        }
    },
    transactions: {
        getAll: async () => {
            const resp = await fetch(`${API_URL}/transactions`);
            return resp.json();
        },
        create: async (data: any) => {
            const resp = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return resp.json();
        },
        update: async (id: string, data: any) => {
            const resp = await fetch(`${API_URL}/transactions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return resp.json();
        },
        delete: async (id: string) => {
            await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' });
        }
    },
    events: {
        getAll: async () => {
            const resp = await fetch(`${API_URL}/events`);
            return resp.json();
        },
        create: async (data: any) => {
            const resp = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return resp.json();
        },
        update: async (id: string, data: any) => {
            const resp = await fetch(`${API_URL}/events/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return resp.json();
        },
        delete: async (id: string) => {
            const resp = await fetch(`${API_URL}/events/${id}`, { method: 'DELETE' });
            if (!resp.ok) {
                const error = await resp.json();
                throw new Error(error.message || 'Error deleting event');
            }
        },
        getRegistrations: async (id: string) => {
            const resp = await fetch(`${API_URL}/events/${id}/registrations`);
            return resp.json();
        },
        registerParticipant: async (id: string, data: any) => {
            const resp = await fetch(`${API_URL}/events/${id}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return resp.json();
        },
        updateRegistration: async (regId: string, data: any) => {
            const resp = await fetch(`${API_URL}/events/registrations/${regId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return resp.json();
        }
    },
    kids: {
        getBase: async () => {
            const resp = await fetch(`${API_URL}/kids/base`);
            return resp.json();
        },
        register: async (data: any) => {
            const resp = await fetch(`${API_URL}/kids/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return resp.json();
        },
        update: async (id: string, data: any) => {
            const resp = await fetch(`${API_URL}/kids/update/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return resp.json();
        },
        getPresent: async () => {
            const resp = await fetch(`${API_URL}/kids/present`);
            return resp.json();
        },
        checkin: async (kidId: string, room: string) => {
            const resp = await fetch(`${API_URL}/kids/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kidId, room }),
            });
            return resp.json();
        },
        checkout: async (id: string) => {
            await fetch(`${API_URL}/kids/checkout/${id}`, { method: 'POST' });
        }
    },
    ministries: {
        getAll: async () => {
            const resp = await fetch(`${API_URL}/ministries`);
            return resp.json();
        },
        create: async (data: any) => {
            const resp = await fetch(`${API_URL}/ministries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return resp.json();
        }
    },
    schedules: {
        getAll: async () => {
            const resp = await fetch(`${API_URL}/schedules`);
            return resp.json();
        },
        create: async (data: any) => {
            const resp = await fetch(`${API_URL}/schedules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return resp.json();
        },
        update: async (id: string, data: any) => {
            const resp = await fetch(`${API_URL}/schedules/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return resp.json();
        }
    },
    secretary: {
        getDocuments: async () => {
            const resp = await fetch(`${API_URL}/secretary/documents`);
            return resp.json();
        },
        createDocument: async (formData: FormData) => {
            const resp = await fetch(`${API_URL}/secretary/documents`, {
                method: 'POST',
                body: formData, // No Content-Type header needed for FormData
            });
            return resp.json();
        },
        deleteDocument: async (id: string) => {
            await fetch(`${API_URL}/secretary/documents/${id}`, { method: 'DELETE' });
        },
        search: async (query: string) => {
            const resp = await fetch(`${API_URL}/secretary/search?q=${encodeURIComponent(query)}`);
            return resp.json();
        },
        getNotifications: async () => {
            const resp = await fetch(`${API_URL}/secretary/notifications`);
            return resp.json();
        }
    },
    auth: {
        login: async (credentials: any) => {
            const resp = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            return resp.json();
        },
        register: async (userData: any) => {
            const resp = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            return resp.json();
        },
        resetPassword: async (data: any) => {
            const resp = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return resp.json();
        }
    }
};
