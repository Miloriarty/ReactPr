import { request } from './request';

export async function getCategories() {
    return request('/categories');
}

export async function createCategory(name, userId) {
    return request('/categories', { method: 'POST', body: { name }, userId });
}

export async function deleteCategory(id, userId) {
    return request(`/categories/${id}`, { method: 'DELETE', userId });
}
