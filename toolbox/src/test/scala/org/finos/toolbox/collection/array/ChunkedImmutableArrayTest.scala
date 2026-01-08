package org.finos.toolbox.collection.array

import org.finos.toolbox.time.{Clock, DefaultClock, TimeIt}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ChunkedImmutableArrayTest extends AnyFeatureSpec with Matchers {

  implicit val time: Clock = new DefaultClock

  Feature("check immutable array impl") {

    Scenario("Check iterator on immutable array"){
      var array = ChunkedImmutableArray.empty[String]()
      array = array +("Chris")
      array = array +("Was")
      array = array +("Here")
      array.map(f => f).toList should equal(List("Chris", "Was", "Here"))
    }

    Scenario("Check iterator toList"){
      var array = ChunkedImmutableArray.empty[String]()
      array = array +("Chris")
      array = array +("Was")
      array = array +("Here")
      array.iterator.toList should equal(List("Chris", "Was", "Here"))
    }

    Scenario("Check iterator toArray"){
      var array = ChunkedImmutableArray.empty[String]()
      array = array +("Chris")
      array = array +("Was")
      array = array +("Here")
      array.iterator.toArray should equal(Array("Chris", "Was", "Here"))
    }

    Scenario("test appending two arrays with small chunks"){
      var array = ChunkedImmutableArray.empty[String](3)

      array = array.+("Chris")
      array = array.+("Was")
      array = array.+("Here")
      array = array.+("Foo")
      array = array.+("Bar")

      array.length should equal(5)
      array.asInstanceOf[ChunkedImmutableArray[String]].countOfChunks should equal(2)

      var array2 = ChunkedImmutableArray.empty[String](3)

      array2 = array2.+("Bekki")
      array2 = array2.+("Was")
      array2 = array2.+("AlsoHere")
      array2 = array2.+("Bar")
      array2 = array2.+("Foo")
      array2.length should equal(5)

      val unioned = array.++(array2)

      unioned.asInstanceOf[ChunkedImmutableArray[String]].countOfChunks should equal(4)
      unioned.length should equal(10)

      unioned.map( x => x).toList should equal(List("Chris", "Was", "Here", "Foo", "Bar", "Bekki", "Was", "AlsoHere", "Bar", "Foo"))

      unioned.indexOf("Here") should equal(2)
      unioned.contains("Here") shouldBe true
    }

    Scenario("Create a chunked array and then remove an item"){

      var array = ChunkedImmutableArray.empty[String](3)

      array = array.+("Chris")
      array = array.+("Was")
      array = array.+("Here")
      array = array.+("Foo")
      array = array.+("Bar")

      array shouldEqual ChunkedImmutableArray.from(Array("Chris", "Was", "Here", "Foo", "Bar"))

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
    }

    Scenario("Create a singleton and then remove an item, with various chunk sizes") {

      val array = ChunkedImmutableArray.from(Array("Mikey"), 1)

      var result = array.-("Mikey")

      result.isEmpty shouldEqual true

      result = result.+("Mikey")
      result shouldEqual array

      val array2 = ChunkedImmutableArray.from(Array("Mikey"), 1000)

      var result2 = array.-("Mikey")

      result2.isEmpty shouldEqual true

      result2 = result2.+("Mikey")
      result2 shouldEqual array
    }

    Scenario("Create from existing array") {

      val sourceArray = Array("chris", "was", "here", "chunking", "arrays", "late", "into", "the", "night")

      val array = ChunkedImmutableArray.from(sourceArray, chunkSize = 2)

      array.length should equal(9)
      array.asInstanceOf[ChunkedImmutableArray[String]].chunkSize should equal(2)
      array.asInstanceOf[ChunkedImmutableArray[String]].countOfChunks should equal(5)

      val x = Set.from(sourceArray)

    }

    Scenario("check array subtraction") {

      val a1 = ChunkedImmutableArray.from[String](Array("1", "2", "3"))

      val a2 = a1.-("2")

      a2.toArray.sameElements((a1.-("2").iterator.toArray[String])) shouldBe (true)

      a2 shouldNot equal(a1)
    }

    Scenario("remove a value by index") {
      val a1 = ChunkedImmutableArray.from[String](Array("1", "2", "3"))

      val a2 = a1.remove(1)

      a2.toArray.sameElements(a1.-("2").iterator.toArray[String]) shouldBe (true)

    }

    Scenario("build very big immutable array and then remove an item") {

      val numbers = (0 to 100000).map(_.toString).toArray

      val immute = ChunkedImmutableArray.from[String](numbers)

      val (millis, _) = TimeIt.timeIt {
        (0 to 1000).foreach(i => immute.-(i.toString))
      }

      println(s"$millis to remove 1000 items")
    }

    Scenario("check equals and hashcode") {

      val numbers = (0 to 100000).map(_.toString).toArray

      val array1 = ChunkedImmutableArray.from[String](numbers, 1000)
      val array2 = ChunkedImmutableArray.from[String](numbers, 1000)
      val array3 = ChunkedImmutableArray.from[String](numbers.slice(0, 100), 1000)

      array1 shouldEqual array1

      array1 shouldEqual array2
      array1.hashCode() shouldEqual array2.hashCode()

      array1 should not equal array3
    }



  }
}
