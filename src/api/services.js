import { request } from './request';

export async function getServices(categoryIds = []) {
    const query = categoryIds.length ? `?categories=${categoryIds.join(',')}` : '';
    return request(`/services${query}`);
}

export async function setServiceDiscount(id, discountPercent, userId) {
    return request(`/services/${id}/discount`, {
        method: 'PUT',
        body: { discount_percent: discountPercent },
        userId,
    });
}
