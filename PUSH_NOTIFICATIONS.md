Push Notifications — Backend Protocol
This document specifies the backend endpoints and Expo push token flow
for sending push notifications to the React Native app.

Overview
text

App                     Backend                      Expo Push Service
 |                        |                               |
 |-- POST /register ----->|                               |
 |   {token,platform,     |                               |
 |    deviceId}           |                               |
 |<-- 200 OK -------------|                               |
 |                        |                               |
 |                        |-- POST /push/send ----------->|
 |                        |   {to: token,                 |
 |                        |    title, body, data}         |
 |                        |<-- 200 OK --------------------|
 |                        |                               |
 |<-- notification --------|<------------------------------|
 |   (delivered by OS)    |                               |
1. Device Registration
When the app logs in, it obtains an Expo push token and registers it.

POST /notifications/register
Auth: JWT (gateway injects X-User-Id)

Request body:

json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "android",
  "deviceId": "abc-123-def"
}
Response: 200 OK (or 201 Created if new)

The backend should store a mapping: userId → [{ token, platform, deviceId, registeredAt }].

A user may have multiple devices — store all tokens and send to each.

DELETE /notifications/register
Auth: JWT

Request body:

json

{ "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }
Response: 204 No Content

Called on logout to stop sending notifications to that device.

2. Sending Notifications
The backend sends notifications via the Expo Push API:

POST https://exp.host/--/api/v2/push/send
Headers:

text

Content-Type: application/json
Authorization: Bearer <EXPO_ACCESS_TOKEN>
Get the access token from the Expo dashboard (Settings → Access Tokens).
Store it as an environment variable on the server.

Request body (single):

json

{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "JobPrep AI",
  "body": "Great work! Your accuracy jumped 4%. Ready for a harder challenge? 🎯",
  "data": {
    "screen": "practice",
    "params": { "deckId": "123" }
  },
  "sound": "default",
  "badge": 1
}
Request body (batch — up to 100 per request):

json

[
  { "to": "ExponentPushToken[aaa...]", "title": "...", "body": "..." },
  { "to": "ExponentPushToken[bbb...]", "title": "...", "body": "..." }
]
Response:

json

{
  "data": {
    "status": "ok",
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
Notification data payload
The data field is received by the app when the user taps the notification.
The app uses it to route to the correct screen:

json

{
  "data": {
    "screen": "practice",
    "params": { "deckId": "123", "title": "Two Pointers" }
  }
}
Supported screen values (mapped in the app's _layout.tsx):

screen
Route
dashboard	/(app)/dashboard
library	/(app)/library
practice	/(app)/practice
tutor	/(app)/tutor
achievements	/(app)/achievements
notifications	/(app)/notifications
leaderboard	/(app)/leaderboard
study_plan	/(app)/study-plan
session_results	/(app)/mock-report

3. Notification Types to Send
Trigger
Title
Body
screen
AI Tutor reply	"JobPrep AI"	"Great question! Here's my take..."	tutor
Streak warning (6pm, no practice)	"Don't break your streak! 🔥"	"You're on a 13-day streak. Answer 1 question today."	practice
Achievement unlocked	"Achievement unlocked! 🎯"	"You earned 'Sharp Shooter' — scored 90%+ on a deck."	achievements
Session completed	"Session results ready"	"You scored 87% on Two Pointers. Tap to see breakdown."	session_results
New deck available	"New deck: React Internals 🧩"	"15 hard questions for senior frontend roles."	library
Rank changed	"You climbed the leaderboard 🏆"	"You're now #142 — up 18 spots this week!"	leaderboard
Daily study plan reminder	"Today's plan awaits ⏰"	"2 sessions scheduled for today. Keep the streak alive!"	study_plan

4. Spring Boot Implementation
Entity
java

@Entity
@Table(name = "device_tokens")
public class DeviceToken {
  @Id @GeneratedValue
  private Long id;
  
  private String userId;
  private String token;           // ExponentPushToken[...]
  private String platform;        // android | ios
  private String deviceId;
  private Instant registeredAt;
  private Instant lastUsedAt;
  
  // getters/setters
}
Controller
java

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
  
  private final DeviceTokenRepository tokenRepo;
  private final ExpoPushService pushService;
  
  @PostMapping("/register")
  public ResponseEntity<Void> register(
      @RequestBody @Valid RegisterDeviceRequest req,
      @RequestHeader("X-User-Id") String userId) {
    tokenRepo.save(new DeviceToken(userId, req.getToken(), 
                                  req.getPlatform(), req.getDeviceId()));
    return ResponseEntity.ok().build();
  }
  
  @DeleteMapping("/register")
  public ResponseEntity<Void> unregister(
      @RequestBody Map<String, String> body,
      @RequestHeader("X-User-Id") String userId) {
    tokenRepo.deleteByUserIdAndToken(userId, body.get("token"));
    return ResponseEntity.noContent().build();
  }
  
  /** Internal: send a push to a user (called by other services). */
  @PostMapping("/send")
  public ResponseEntity<Void> send(
      @RequestBody SendNotificationRequest req,
      @RequestHeader("X-User-Id") String userId) {
    List<DeviceToken> tokens = tokenRepo.findByUserId(userId);
    pushService.send(tokens, req.getTitle(), req.getBody(), req.getData());
    return ResponseEntity.ok().build();
  }
}
Expo Push Service
java

@Service
public class ExpoPushService {
  
  @Value("${expo.push.token}")
  private String expoToken;
  
  private final RestClient client = RestClient.create("https://exp.host/--/api/v2");
  
  public void send(List<DeviceToken> devices, String title, String body, Map<String, Object> data) {
    List<Map<String, Object>> messages = devices.stream()
      .map(d -> Map.of(
        "to", d.getToken(),
        "title", title,
        "body", body,
        "data", data != null ? data : Map.of(),
        "sound", "default",
        "badge", 1
      ))
      .toList();
    
    // Expo accepts batches of up to 100.
    client.post()
      .uri("/push/send")
      .header("Authorization", "Bearer " + expoToken)
      .contentType(MediaType.APPLICATION_JSON)
      .body(messages)
      .retrieve()
      .toBodilessEntity();
  }
}
application.yml
yaml

expo:
  push:
    token: ${EXPO_PUSH_TOKEN:your-expo-access-token}
5. Scheduled Notifications
Use Spring's @Scheduled for time-based triggers:

java

@Component
@RequiredArgsConstructor
public class StreakReminderScheduler {
  
  private final UserStatsService statsService;
  private final ExpoPushService pushService;
  private final DeviceTokenRepository tokenRepo;
  
  // Run every day at 6pm user-local time (simplified: server 6pm UTC).
  @Scheduled(cron = "0 0 18 * * *")
  public void remindStreaks() {
    List<User> activeUsers = userService.getActiveUsers();
    for (User user : activeUsers) {
      UserStats stats = statsService.getStats(user.getId());
      if (stats.getStreakDays() > 0 && !statsService.practicedToday(user.getId())) {
        List<DeviceToken> tokens = tokenRepo.findByUserId(user.getId());
        pushService.send(tokens,
          "Don't break your streak! 🔥",
          "You're on a " + stats.getStreakDays() + "-day streak. Answer 1 question today.",
          Map.of("screen", "practice")
        );
      }
    }
  }
}
6. App-side Configuration
In app.json (Expo config):

json

{
  "expo": {
    "projectId": "your-expo-project-id",
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#2e8bee",
      "iosDisplayInForeground": true
    },
    "android": {
      "useNextNotificationsApi": true
    },
    "plugins": ["expo-notifications"]
  }
}
7. Testing
Send a test notification (no backend needed)
bash

curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[your-token-here]",
    "title": "Test",
    "body": "Hello from JobPrep!",
    "data": { "screen": "practice" }
  }'
Get the token by running the app and checking the console log:

text

[push] Registered: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
8. Dependencies
In the RN app:

bash

npx expo install expo-notifications
