package org.finos.vuu.net.json

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver
import org.finos.vuu.net._
import org.finos.vuu.net.rpc.{JsonSubTypeRegistry, VsJsonTypeResolver}
import org.finos.vuu.viewport.ViewPortTable
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers


@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonTypeIdResolver(classOf[VsJsonTypeResolver])
trait Animal

case class Dolphin(snout: Boolean) extends Animal
case class Whale(fin: Boolean, blowhole: Boolean) extends Animal

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes(Array(
  new Type(value = classOf[Dolphin], name = "DOLPHIN"),
  new Type(value = classOf[Whale], name = "WHALE")
))
trait SeaAnimalMixin{}

case class Rhino(horn: Boolean) extends Animal
case class Elephant(legs: String) extends Animal


@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes(Array(
  new Type(value = classOf[Rhino], name = "RHINO"),
  new Type(value = classOf[Elephant], name = "ELEPHANT")
))
trait LandAnimalMixin{}

case class Container(animal: Animal)

class JsonVsSerializerTest extends AnyFeatureSpec with Matchers{

  def roundTrip(body: MessageBody) = {

    val message = JsonViewServerMessage("REQ:123", "SESS:456", "AAA", "chris", body)

    val json = JsonVsSerializer.serialize(message)

    println("To Json = " + json)

    val o = JsonVsSerializer.deserialize(json)

    o should equal(message)

    println("from Json = " + o)
  }

  Feature("test serialization"){

    Scenario("test login message"){

      JsonSubTypeRegistry.register(classOf[MessageBody], classOf[CoreJsonSerializationMixin])

      roundTrip(LoginRequest("AAA11122233", "chris"))
      roundTrip(LoginSuccess("AAA11122233", "vuuServerId"))
      roundTrip(HeartBeat(123l))
      roundTrip(HeartBeatResponse(123l))
      roundTrip(RpcUpdate(ViewPortTable("orderEntry", "CORE"), "Foo", Map("Foo" -> 123, "Bar" -> true, "Whizzle" -> "TANG", "HooHa" -> 344567l)))
      roundTrip(RpcSuccess(ViewPortTable("orderEntry", "CORE"), "Foo"))
      roundTrip(RpcReject(ViewPortTable("orderEntry", "CORE"), "Foo", "cause you aint pretty"))
      roundTrip(OpenTreeNodeSuccess("orderEntry", "..."))
      //roundTrip(RpcCall("doSomething", Array("foo", 123.12d), Map()))

      //table row update.data comes back as strings when deserialized, need to add special compare check
//      roundTrip(TableRowUpdates("batch", "U", false, 1l, Array(
//        RowUpdate("Vp1", 1, 0,":KEY1", 100l, Array("foo", "bar", 1)),
//        RowUpdate("Vp2", 1, 0,":KEY1", 100l, Array("bundle", "cheese", 1, true))
//      )))

    }

    Scenario("test mixing registry"){

      JsonSubTypeRegistry.register(classOf[Animal], classOf[LandAnimalMixin])
      JsonSubTypeRegistry.register(classOf[Animal], classOf[SeaAnimalMixin])

      val registry = JsonSubTypeRegistry

      def roundTripToObj(c: Container): Unit = {

        val mapper = JsonVsSerializer.getMapper

        val json = mapper.writeValueAsString(c)

        println(json)

        val o2 = mapper.readValue(json, classOf[Container])

        assert(c == o2)
      }

      roundTripToObj(Container(Rhino(true)))

      roundTripToObj(Container(Whale(true, true)))

    }

  }

}
