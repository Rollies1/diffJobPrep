import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter, Gauge } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const createCategoryTrend = new Trend('create_category_duration');
const createQuestionTrend = new Trend('create_question_duration');
const getCategoriesTrend = new Trend('get_categories_duration');
const getQuestionsTrend = new Trend('get_questions_duration');
const errorRate = new Rate('errors');

const testProfile = __ENV.TEST_PROFILE || 'load';

const profiles = {
  load: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  stress: [
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 400 },
    { duration: '2m', target: 0 },
  ],
  spike: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 1000 },
    { duration: '30s', target: 10 },
    { duration: '2m', target: 0 },
  ]
};

export const options = {
  stages: profiles[testProfile] || profiles['load'],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    'http_req_duration{expected_response:true}': ['p(99)<1000'],
    'errors': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8082';

export function setup() {
  console.log(`Starting ${testProfile} test for Question Service`);
  return {};
}

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  group('Read Operations', () => {
    const listStart = Date.now();
    const listRes = http.get(`${BASE_URL}/questions/categories`, { headers });
    getCategoriesTrend.add(Date.now() - listStart);

    check(listRes, { 'list categories status 200': (r) => r.status === 200 });

    const qStart = Date.now();
    const qRes = http.get(`${BASE_URL}/questions`, { headers });
    getQuestionsTrend.add(Date.now() - qStart);
    
    check(qRes, { 'list questions status 200': (r) => r.status === 200 });
  });

  sleep(randomIntBetween(1, 3));
}
