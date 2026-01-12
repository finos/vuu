package org.finos.toolbox.collection.set

import org.finos.toolbox.collection.array.ChunkedImmutableArray
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ChunkedImmutableArraySetTest extends AnyFeatureSpec with Matchers {

  given time: Clock = DefaultClock()

  Feature("check immutable array impl") {

    Scenario("Check iterator on immutable array"){
      var array = ChunkedImmutableArraySet.empty[String]()
      array = array +("Chris")
      array = array +("Was")
      array = array +("Here")
      array.map(f => f).toList should equal(List("Chris", "Was", "Here"))
    }

    Scenario("test appending two arrays with small chunks"){
      var array = ChunkedImmutableArraySet.empty[String](3)

      array = array.+("Chris")
      array = array.+("Was")
      array = array.+("Here")
      array = array.+("Foo")
      array = array.+("Bar")

      array.length should equal(5)
      array.asInstanceOf[ChunkedImmutableArraySet[String]].countOfChunks should equal(2)

      var array2 = ChunkedImmutableArraySet.empty[String](3)

      array2 = array2.+("Bekki")
      array2 = array2.+("Was")
      array2 = array2.+("AlsoHere")
      array2 = array2.+("Bar")
      array2 = array2.+("Foo")
      array2.length should equal(5)

      val unioned = array.++(array2)

      unioned.asInstanceOf[ChunkedImmutableArraySet[String]].countOfChunks should equal(4)
      unioned.length should equal(7)

      unioned.map( x => x).toList should equal(List("Chris", "Was", "Here", "Foo", "Bar", "Bekki", "AlsoHere"))

      unioned.indexOf("Here") should equal(2)
      unioned.contains("Here") shouldBe true
    }

    Scenario("Create a chunked array and then remove items"){

      var array = ChunkedImmutableArraySet.empty[String](5)

      val chunks = array.asInstanceOf[ChunkedImmutableArraySet[String]].chunks

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

      val array = ChunkedImmutableArraySet.from[String](Array("Mikey"), 1)

      val result = array.-("Mikey")

      result.isEmpty shouldEqual true

      val array2 = ChunkedImmutableArraySet.from[String](Array("Mikey"))

      val result2 = array.-("Mikey")

      result2.isEmpty shouldEqual true
    }

    Scenario("check equals and hashcode") {

      val numbers = (0 to 100000).map(_.toString).toArray

      val array1 = ChunkedImmutableArraySet.from[String](numbers)
      val array2 = ChunkedImmutableArraySet.from[String](numbers)
      val array3 = ChunkedImmutableArraySet.from[String](numbers.slice(0, 100))

      array1 shouldEqual array1

      array1 shouldEqual array2
      array1.hashCode() shouldEqual array2.hashCode()

      array1 should not equal array3
    }

    Scenario("set by index on chunk boundaries") {

      val numbers = (0 until 10).map(_.toString).toArray
      val original = ChunkedImmutableArraySet.from[String](numbers, 2)
      val tobeMutated = ChunkedImmutableArraySet.from[String](numbers, 2)

      for (num <- numbers) {
        val expected = num.toInt + 10

        val updated = tobeMutated.set(num.toInt, s"$expected")

        updated(num.toInt) shouldEqual s"$expected"
        tobeMutated shouldEqual original
      }
    }

    Scenario("removal on chunk boundaries") {

      val numbers = (0 until 10).map(_.toString).toArray
      val original = ChunkedImmutableArraySet.from[String](numbers, 2)
      val tobeMutated = ChunkedImmutableArraySet.from[String](numbers, 2)

      for (num <- numbers) {
        val updated = tobeMutated.remove(num.toInt)

        updated.contains(num) shouldBe false
        updated.length shouldEqual 9

        tobeMutated shouldEqual original
      }
    }
    
  }
}
