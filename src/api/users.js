import { request } from './request';

export async function getUsers(userId) {
    return request('/users', { userId });
}

export async function getCoupons(userId) {
    return request('/coupons', { userId });
}

export async function setUserCoupon(id, couponId, userId) {
    return request(`/users/${id}/coupon`, {
        method: 'PUT',
        body: { coupon_id: couponId },
        userId,
    });
}
