import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter, Gauge } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const createSessionTrend = new Trend('create_session_duration');
const submitAnswerTrend = new Trend('submit_answer_duration');
const completeSessionTrend = new Trend('complete_session_duration');
const getSessionTrend = new Trend('get_session_duration');
const getUserSessionsTrend = new Trend('get_user_sessions_duration');
const getStatsTrend = new Trend('get_stats_duration');

const errorRate = new Rate('errors');
const activeSessions = new Gauge('active_sessions');
const sessionsCreated = new Counter('sessions_created');
const answersSubmitted = new Counter('answers_submitted');
const sessionsCompleted = new Counter('sessions_completed');

// Test configuration profiles (pass TEST_PROFILE=stress or spike to change type)
const testProfile = __ENV.TEST_PROFILE || 'load';

const profiles = {
  load: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  stress: [
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 400 },
    { duration: '2m', target: 800 },
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
    http_req_duration: ['p(95)<500'],         // 95% of requests under 500ms
    'http_req_duration{expected_response:true}': ['p(99)<1000'], // 99% under 1s
    'create_session_duration': ['p(95)<300'], // Create session under 300ms
    'submit_answer_duration': ['p(95)<200'],  // Submit answer under 200ms
    'errors': ['rate<0.01'],                  // Error rate under 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const API_PREFIX = '/api/v1/sessions';

export function setup() {
  console.log(`Starting ${testProfile} performance test against ${BASE_URL}`);
  return {};
}

export default function () {
  const userId = `user-${__VU}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
  };

  group('Create Session', () => {
    const payload = JSON.stringify({
      userId: userId,
      categoryId: uuidv4(),
      difficulty: ['EASY', 'MEDIUM', 'HARD'][randomIntBetween(0, 2)],
      totalQuestions: randomIntBetween(5, 20),
    });

    const start = Date.now();
    const res = http.post(`${BASE_URL}${API_PREFIX}`, payload, { headers });
    createSessionTrend.add(Date.now() - start);

    const success = check(res, {
      'create status is 201': (r) => r.status === 201,
      'create has session id': (r) => {
        try {
          return JSON.parse(r.body).id !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    if (!success) {
      errorRate.add(1);
      console.error(`Create failed: ${res.status} ${res.body}`);
      return;
    }

    sessionsCreated.add(1);
    const session = JSON.parse(res.body);
    activeSessions.add(1);

    // Simulate quiz-taking: submit answers
    group('Submit Answers', () => {
      const totalQuestions = session.totalQuestions;
      const questionsToAnswer = randomIntBetween(1, totalQuestions);

      for (let i = 0; i < questionsToAnswer; i++) {
        const answerPayload = JSON.stringify({
          questionId: uuidv4(),
          userResponse: `Option ${String.fromCharCode(65 + randomIntBetween(0, 4))}`,
        });

        const ansStart = Date.now();
        const ansRes = http.post(
          `${BASE_URL}${API_PREFIX}/${session.id}/answers`,
          answerPayload,
          { headers }
        );
        submitAnswerTrend.add(Date.now() - ansStart);

        const ansSuccess = check(ansRes, {
          'answer status is 200': (r) => r.status === 200,
        });

        if (!ansSuccess) {
          errorRate.add(1);
          console.error(`Answer failed: ${ansRes.status} ${ansRes.body}`);
          break;
        }

        answersSubmitted.add(1);
        sleep(randomIntBetween(1, 3)); // Think time between answers
      }

      // Complete session (50% of the time)
      if (Math.random() > 0.5) {
        const completePayload = JSON.stringify({
          evaluationId: uuidv4(),
          overallScore: randomIntBetween(0, 100),
        });

        const compStart = Date.now();
        const compRes = http.post(
          `${BASE_URL}${API_PREFIX}/${session.id}/complete`,
          completePayload,
          { headers }
        );
        completeSessionTrend.add(Date.now() - compStart);

        check(compRes, {
          'complete status is 200': (r) => r.status === 200,
        });

        sessionsCompleted.add(1);
        activeSessions.add(-1);
      }
    });

    // Read operations
    group('Read Operations', () => {
      // Get session by ID
      const getStart = Date.now();
      const getRes = http.get(`${BASE_URL}${API_PREFIX}/${session.id}`, { headers });
      getSessionTrend.add(Date.now() - getStart);

      check(getRes, {
        'get session status is 200': (r) => r.status === 200,
      });

      // Get user sessions
      const listStart = Date.now();
      const listRes = http.get(`${BASE_URL}${API_PREFIX}`, { headers });
      getUserSessionsTrend.add(Date.now() - listStart);

      check(listRes, {
        'list sessions status is 200': (r) => r.status === 200,
      });

      // Get user stats
      const statsStart = Date.now();
      const statsRes = http.get(`${BASE_URL}${API_PREFIX}/stats`, { headers });
      getStatsTrend.add(Date.now() - statsStart);

      check(statsRes, {
        'stats status is 200': (r) => r.status === 200,
      });
    });

    sleep(randomIntBetween(2, 5)); // Think time between user sessions
  });
}

export function teardown(data) {
  console.log('Performance test completed');
}
