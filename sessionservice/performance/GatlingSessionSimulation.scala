package com.knust.codequest.sessionservice.performance

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
import java.util.UUID

class SessionServiceSimulation extends Simulation {

  val baseUrl = System.getProperty("baseUrl", "http://localhost:8080")
  val apiPrefix = "/api/v1/sessions"

  val httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
    .header("X-User-Id", "user-${userId}")

  // Feeder for random data
  val feeder = Iterator.continually(Map(
    "userId" -> UUID.randomUUID().toString,
    "categoryId" -> UUID.randomUUID().toString,
    "questionId" -> UUID.randomUUID().toString,
    "evaluationId" -> UUID.randomUUID().toString,
    "difficulty" -> Seq("EASY", "MEDIUM", "HARD")(scala.util.Random.nextInt(3)),
    "totalQuestions" -> (5 + scala.util.Random.nextInt(16)),
    "score" -> scala.util.Random.nextInt(101)
  ))

  // Create session scenario
  val createSession = exec(http("Create Session")
    .post(apiPrefix)
    .body(StringBody("""{"userId":"${userId}","categoryId":"${categoryId}","difficulty":"${difficulty}","totalQuestions":${totalQuestions}}"""))
    .check(status.is(201))
    .check(jsonPath("$.id").saveAs("sessionId")))
    .pause(1)

  // Submit answer scenario (Using string concatenation for Gatling variables to resolve properly)
  val submitAnswer = exec(http("Submit Answer")
    .post(apiPrefix + "/${sessionId}/answers")
    .body(StringBody("""{"questionId":"${questionId}","userResponse":"Option A"}"""))
    .check(status.is(200)))
    .pause(1, 3)

  // Complete session scenario
  val completeSession = exec(http("Complete Session")
    .post(apiPrefix + "/${sessionId}/complete")
    .body(StringBody("""{"evaluationId":"${evaluationId}","overallScore":${score}}"""))
    .check(status.is(200)))
    .pause(1)

  // Get session scenario
  val getSession = exec(http("Get Session")
    .get(apiPrefix + "/${sessionId}")
    .check(status.is(200)))
    .pause(1)

  // Get user sessions scenario
  val getUserSessions = exec(http("Get User Sessions")
    .get(apiPrefix)
    .check(status.is(200)))
    .pause(1)

  // Get stats scenario
  val getStats = exec(http("Get User Stats")
    .get(apiPrefix + "/stats")
    .check(status.is(200)))
    .pause(1)

  // Full user journey
  val userJourney = scenario("User Journey")
    .feed(feeder)
    .exec(createSession)
    .repeat("${totalQuestions}") {
      exec(submitAnswer)
    }
    .exec(completeSession)
    .exec(getSession)
    .exec(getUserSessions)
    .exec(getStats)

  // Read-heavy scenario
  val readHeavy = scenario("Read Heavy")
    .feed(feeder)
    .exec(createSession)
    .exec(getSession)
    .exec(getUserSessions)
    .exec(getStats)
    .pause(1)

  // Write-heavy scenario
  val writeHeavy = scenario("Write Heavy")
    .feed(feeder)
    .exec(createSession)
    .repeat(10) {
      exec(submitAnswer)
    }
    .exec(completeSession)

  setUp(
    userJourney.inject(
      rampUsers(50).during(2.minutes),
      constantUsersPerSec(10).during(5.minutes),
      rampUsers(50).during(2.minutes),
      constantUsersPerSec(20).during(5.minutes),
      rampUsersTo(0).during(2.minutes)
    ),
    readHeavy.inject(
      rampUsers(100).during(2.minutes),
      constantUsersPerSec(30).during(5.minutes),
      rampUsersTo(0).during(2.minutes)
    ),
    writeHeavy.inject(
      rampUsers(30).during(2.minutes),
      constantUsersPerSec(5).during(5.minutes),
      rampUsersTo(0).during(2.minutes)
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.max.lt(2000),
     global.responseTime.percentile(95).lt(500),
     global.successfulRequests.percent.gt(99.0)
   )
}
