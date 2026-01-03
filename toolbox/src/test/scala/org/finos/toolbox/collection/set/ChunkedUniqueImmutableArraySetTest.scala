package org.finos.toolbox.collection.set

import org.finos.toolbox.time.{Clock, DefaultClock}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ChunkedUniqueImmutableArraySetTest extends AnyFeatureSpec with Matchers {

  given time: Clock = DefaultClock()

  Feature("check immutable array impl") {

    Scenario("Check iterator on immutable array"){
      var array = ImmutableUniqueArraySet.empty[String]()
      array = array +("Chris")
      array = array +("Was")
      array = array +("Here")
      array.map(f => f).toList should equal(List("Chris", "Was", "Here"))
    }

    Scenario("test appending two arrays with small chunks"){
      var array = ImmutableUniqueArraySet.empty[String](3)

      array = array.+("Chris")
      array = array.+("Was")
      array = array.+("Here")
      array = array.+("Foo")
      array = array.+("Bar")

      array.length should equal(5)
      array.asInstanceOf[ChunkedUniqueImmutableArraySet[String]].countOfChunks should equal(2)

      var array2 = ImmutableUniqueArraySet.empty[String](3)

      array2 = array2.+("Bekki")
      array2 = array2.+("Was")
      array2 = array2.+("AlsoHere")
      array2 = array2.+("Bar")
      array2 = array2.+("Foo")
      array2.length should equal(5)

      val unioned = array.++(array2)

      unioned.asInstanceOf[ChunkedUniqueImmutableArraySet[String]].countOfChunks should equal(4)
      unioned.length should equal(7)

      unioned.map( x => x).toList should equal(List("Chris", "Was", "Here", "Foo", "Bar", "Bekki", "AlsoHere"))

      unioned.indexOf("Here") should equal(2)
      unioned.contains("Here") shouldBe true
    }

    Scenario("Create a chunked array and then remove items"){

      var array = ImmutableUniqueArraySet.empty[String](5)

      val chunks = array.asInstanceOf[ChunkedUniqueImmutableArraySet[String]].chunks

      array = array.+("Chris")
      array = array.+("Was")
      array = array.+("Here")
      array = array.+("Foo")
      array = array.+("Bar")

      val result = array.-("Foo")

      result.map( x => x).toList should equal(List("Chris", "Was", "Here", "Bar"))
      result.length shouldEqual(4)

      val result2 = result.-("Was")

      result2.map( x => x).toList should equal(List("Chris", "Here", "Bar"))
      result2.length shouldEqual(3)

      val result3 = result2.-("Bar")

      result3.map( x => x).toList should equal(List("Chris", "Here"))
      result3.length shouldEqual(2)

      val result4 = result3.-("Chris")

      result4.map( x => x).toList should equal(List("Here"))
      result4.length shouldEqual(1)

      val result5 = result4.-("Here")

      result5.map( x => x).toList should equal(List())
      result5.length shouldEqual(0)

      val result6 = result5.-("Mikey!")
      result6 shouldEqual(result5)
    }

    Scenario("Create a singleton set and then remove an item, with various chunk sizes"){

      val array = ImmutableUniqueArraySet.from[String](Array("Mikey"), 1)

      val result = array.-("Mikey")

      result.isEmpty shouldEqual true

      val array2 = ImmutableUniqueArraySet.from[String](Array("Mikey"))

      val result2 = array.-("Mikey")

      result2.isEmpty shouldEqual true
    }

  }
}
