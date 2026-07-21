import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
    stages: [
        { duration: '30s', target: 50 },  // Ramp up
        { duration: '1m', target: 50 },   // Sustained load
        { duration: '30s', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500'], // 95% of requests must complete below 1.5s
        http_req_failed: ['rate<0.01'],   // Error rate < 1%
    },
};

const BASE_URL = 'http://localhost:8085/practice';

export default function () {
    const userId = randomString(10);
    const params = {
        headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': userId
        },
    };

    // 1. Get History
    let historyRes = http.get(`${BASE_URL}/history/${userId}`, params);
    check(historyRes, {
        'history status is 200': (r) => r.status === 200,
    });
    sleep(1);

    // 2. Start Session
    const startPayload = JSON.stringify({
        userId: userId,
        categoryId: 1
    });

    let startRes = http.post(`${BASE_URL}/start`, startPayload, params);
    check(startRes, {
        'start session status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'has session id': (r) => r.json('id') !== undefined,
    });
    sleep(1);
}
