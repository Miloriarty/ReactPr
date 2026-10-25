import { request } from './request';

export async function login(email, password) {
    return request('/auth/login', { method: 'POST', body: { email, password } });
}

export async function getMe(userId) {
    return request('/auth/me', { userId });
}
