package io.venuu.vuu.json

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

/**
 * Created by chris on 03/11/2015.
 */
class ObjectMappingTest extends AnyFeatureSpec with Matchers{

  import com.fasterxml.jackson.annotation.JsonSubTypes.Type
  import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
  import com.fasterxml.jackson.databind.ObjectMapper
  import com.fasterxml.jackson.module.scala.DefaultScalaModule



  @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
  @JsonSubTypes(Array(
    new Type(value = classOf[Bar], name = "bar"),
    new Type(value = classOf[Zoom], name = "zoom")
    //new Type(value = classOf[Bungo], name = "z")
  ))
  trait TheTrait
  case class Bar(nestedstr: String, nestedarr: Array[Double]) extends TheTrait
  case class Zoom(nestedarr: Array[Double]) extends TheTrait
  case class Foo(str: String, aarr: Array[String], n:TheTrait)


  trait Request

  case class RequestPacket(clientSessionId: String, token: String, user: String, body: Request)

  case class RequestPacketHelper(clientSessionId: String, token: String, user: String){
    def wrap(body: Request): String = {
      val mapper = new ObjectMapper();
      mapper.registerModule(DefaultScalaModule)
      mapper.writeValueAsString(RequestPacket(clientSessionId, token, user, body))
    }
  }

//  trait Marker
//
//  case class FooBar(groupBy: Array[String], columns: Array[String]) extends Marker
//
//  case class Foo(a: String, b: String)
//
////  @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
////  @JsonSubTypes(Array(
////    new Type(value = classOf[AuthenticateRequest], name = "auth")//,
////    //new Type(value = classOf[ProductDetailsComplex], name = "complex")
////  ))
//
//
//  import scala.beans.BeanProperty
//
//  class AuthenticateRequest(
//                             @BeanProperty val name: String,
//                             @BeanProperty val password: String
//                             ) extends Request

//  case class AuthenticateRequestSerializer(){
//    def serialize(req: AuthenticateRequest): ObjectNode = {
//      val mapper = new ObjectMapper();
//      val node = mapper.createObjectNode();
//      node.put("message", "text");
//    }
//  }

  Feature("test jackson"){

    Scenario("simple object map test"){

//      val mapper = new ObjectMapper()
//
//      mapper.registerModule(DefaultScalaModule)
//
//      val s = mapper.convertValue(FooBar(Array("z"), Array("y")), classOf[JsonNode])
//
//      println(s)

    }

    Scenario("check a request packet"){

//      val mapper = new ObjectMapper()
//
//      mapper.registerModule(DefaultScalaModule)
//
//      val request = RequestPacketHelper("123", "tok", "chris")
//
//      val json = request.wrap(new AuthenticateRequest("chris", "foobar"))
//
//      println(json)
//
//      val tree = mapper.readTree(json)
//
//      val body = tree.get("body")
//
//      //
//
//      println(body.toString)
//
//      //val auth = mapper.treeToValue(body, classOf[AuthenticateRequest])
//
//
//
//      println()

      //val request2 = mapper.readValue[RequestPacket](json, classOf[RequestPacket])

      //println(request2)
    }

    Scenario("check we can mutate object node"){

      val mapper = new ObjectMapper()

      mapper.registerModule(DefaultScalaModule)

      val jNode = mapper.createObjectNode();

      val mutated = jNode.`with`("foo").put("bar", "cheese")

      println(mutated.toString)

    }

  }

}
