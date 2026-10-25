import { request } from './request';

export async function getAppointments(userId) {
    return request('/appointments', { userId });
}

export async function createAppointments(items, userId) {
    return request('/appointments', { method: 'POST', body: { items }, userId });
}
