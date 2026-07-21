package com.knust.codequest.questionservice.performance

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class QuestionServiceSimulation extends Simulation {

  val baseUrl = System.getProperty("baseUrl", "http://localhost:8082")

  val httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")

  val readHeavy = scenario("Read Categories")
    .exec(http("Get Categories")
      .get("/questions/categories")
      .check(status.is(200)))
    .pause(1)

  setUp(
    readHeavy.inject(
      rampUsers(100).during(2.minutes),
      constantUsersPerSec(30).during(5.minutes),
      rampUsersTo(0).during(2.minutes)
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.max.lt(2000),
     global.responseTime.percentile(95).lt(500),
     global.successfulRequests.percent.gt(99.0)
   )
}
