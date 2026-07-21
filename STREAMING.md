AI Tutor WebSocket Streaming — Backend Protocol
This document specifies the WebSocket protocol the Spring Boot backend must
implement to support streaming AI responses in the React Native app.

Connection
Endpoint: ws://<gateway>:8089/ws/ai

The gateway should route /ws/** to the AI service (or a dedicated WebSocket
gateway filter that upgrades the connection).

Authentication: JWT passed as a query parameter:

text

ws://10.0.2.2:8089/ws/ai?token=<accessToken>
The gateway validates the JWT, extracts the user ID, and forwards it as a
header (e.g., X-User-Id) to the AI service — same as HTTP requests.

Why query param? WebSocket upgrade requests don't reliably forward custom
Authorization headers through all gateway/proxy configurations. The query
param approach works universally.

Message Protocol
All messages are JSON text frames.

Client → Server
1. Chat message (streaming response)
json

{
  "type": "chat",
  "message": "Explain the two-pointer technique",
  "context": [
    { "role": "user", "content": "What's a hash map?" },
    { "role": "ai", "content": "A hash map is..." }
  ]
}
The backend should:

Call the LLM with streaming enabled (e.g., OpenAI stream API)
Forward each token/chunk as a token message
Send done when the stream completes
If the message looks like an answer to evaluate, optionally send an
evaluation message before done
2. Evaluation request (structured response)
json

{
  "type": "evaluate",
  "question": "Design a URL shortener",
  "answer": "I would use a hash map to...",
  "category": "System Design"
}
The backend should:

Call the LLM to evaluate the answer
Send an evaluation message with strengths/weaknesses/score
Send done
Server → Client
Token (streamed, repeat N times)
json

{ "type": "token", "content": "Hello" }
{ "type": "token", "content": ", " }
{ "type": "token", "content": "world" }
Evaluation (structured, sent before done)
json

{
  "type": "evaluation",
  "strengths": ["Clear communication", "Good use of examples"],
  "weaknesses": ["Missing time complexity analysis", "Could mention trade-offs"],
  "score": 79,
  "source": "gpt-4"
}
Done (stream complete)
json

{ "type": "done", "messageId": "msg_abc123" }
Error
json

{ "type": "error", "message": "Rate limit exceeded" }
Spring Boot Implementation Guide
1. Add WebSocket dependency
xml

<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
2. WebSocket configuration
java

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(new AiStreamHandler(), "/ws/ai")
            .setAllowedOrigins("*");
  }
}
3. WebSocket handler (sketch)
java

@Component
    JsonNode node = objectMapper.readTree(message.getPayload());
    String type = node.get("type").asText();

    if ("chat".equals(type)) {
      String userMsg = node.get("message").asText();
      List<Map<String, String>> context = objectMapper.convertValue(
        node.get("context"), new TypeReference<>() {});

      // Call LLM with streaming
      aiService.streamChat(userMsg, context)
        .doOnNext(token -> send(session, Map.of("type", "token", "content", token)))
        .doOnComplete(() -> send(session, Map.of("type", "done")))
        .doOnError(e -> send(session, Map.of("type", "error", "message", e.getMessage())))
        .subscribe();
    }

    if ("evaluate".equals(type)) {
      String question = node.get("question").asText();
      String answer = node.get("answer").asText();
      String category = node.get("category").asText();

      EvaluationResponse eval = aiService.evaluate(
        new EvaluationRequest(question, answer, category));

      send(session, Map.of(
        "type", "evaluation",
        "strengths", eval.getStrengths(),
        "weaknesses", eval.getWeaknesses(),
        "score", eval.getScore(),
        "source", eval.getSource()
      ));
      send(session, Map.of("type", "done"));
    }
  }

  private void send(WebSocketSession session, Object payload) {
    try {
      session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
    } catch (IOException e) {
      // handle
    }
  }
}
4. Gateway configuration
Ensure the gateway routes WebSocket upgrade requests. In Spring Cloud Gateway:

yaml

spring:
  cloud:
    gateway:
      routes:
        - id: ai-ws
          uri: ws://aiservice:8081
          predicates:
            - Path=/ws/**
          filters:
            - StripPrefix=0
The gateway should also validate the JWT from the ?token= query param and
inject X-User-Id before forwarding.

Message flow diagram
text

App                        Gateway                    AI Service
 |                            |                           |
 |--- WS connect ------------>|--- forward -------------->|
 |<-- connection open --------|<--------------------------|
 |                            |                           |
 |--- {type:"chat",msg:"..."}>|--- forward -------------->|
 |                            |                           |
 |<-- {type:"token","Hello"} -|<--- stream token ---------|
 |<-- {type:"token",", "} ----|<--- stream token ---------|
 |<-- {type:"token","world"} -|<--- stream token ---------|
 |                            |                           |
 |<-- {type:"evaluation",...} |<--- evaluation -----------|
 |<-- {type:"done"} ----------|<--- done -----------------|
 |                            |                           |
Error handling
Connection failure: The client retries up to 3 times with backoff.
Mid-stream error: The server sends { type: "error", message: "..." }
and the client displays the error in the chat.
Disconnect during stream: The client shows an error message and allows
the user to retry.
Notes
The client accumulates tokens into currentStream and renders them with a
blinking cursor via the StreamingText component.
When done is received, the accumulated text is moved to the messages
array as a permanent AI message.
If an evaluation message was received before done, it's attached to the
AI message and rendered as a structured evaluation card.
The context (last 10 messages) is sent with each chat request so the LLM
has conversation history.
