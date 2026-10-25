export const API_URL = 'http://localhost:3001/api';

export async function request(path, { method = 'GET', body, userId } = {}) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (userId) headers['X-User-Id'] = userId;

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new Error('Server unavailable');
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.error || `Request failed (${response.status})`);
    }
    return data;
}
