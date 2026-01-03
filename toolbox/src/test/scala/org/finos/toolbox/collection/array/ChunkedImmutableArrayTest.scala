package org.finos.toolbox.collection.array

import org.finos.toolbox.time.{Clock, DefaultClock}
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

    Scenario("Create from existing array") {

      val sourceArray = Array("chris", "was", "here", "chunking", "arrays", "late", "into", "the", "night")

      val array = ChunkedImmutableArray.fromArray(sourceArray, chunkSize = 2)

      array.length should equal(9)
      array.asInstanceOf[ChunkedImmutableArray[String]].chunkSize should equal(2)
      array.asInstanceOf[ChunkedImmutableArray[String]].countOfChunks should equal(5)

      val x = Set.from(sourceArray)

      //println(array)

//      array = array.+("Chris")
//      array = array.+("Was")
//      array = array.+("Here")
//      array = array.+("Foo")
//      array = array.+("Bar")
//
//      val result = array.-("Foo")

//      result.map(x => x).toList should equal(List("Chris", "Was", "Here", "Bar"))
//      result.length shouldEqual (4)
//
//      val result2 = result.-("Was")
//
//      result2.map(x => x).toList should equal(List("Chris", "Here", "Bar"))
//      result2.length shouldEqual (3)
//
//      val result3 = result2.-("Bar")
//
//      result3.map(x => x).toList should equal(List("Chris", "Here"))
//      result3.length shouldEqual (2)
//
//      val result4 = result3.-("Chris")
//
//      result4.map(x => x).toList should equal(List("Here"))
//      result4.length shouldEqual (1)
//
//      val result5 = result4.-("Here")
//
//      result5.map(x => x).toList should equal(List())
//      result5.length shouldEqual (0)
    }




  }
}
