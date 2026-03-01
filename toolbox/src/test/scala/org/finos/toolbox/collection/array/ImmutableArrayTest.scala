package org.finos.toolbox.collection.array

import org.finos.toolbox.collection.array.ImmutableArray
import org.scalatest.funsuite.AnyFunSuite
import org.scalatest.matchers.should.Matchers

class ImmutableArrayTest extends AnyFunSuite with Matchers {

  def arr(xs: String*): ImmutableArray[String] = ImmutableArray.from(xs.toArray)

  test("adding an element returns a new array and preserves the original") {
    val original = arr("a", "b", "c")

    val updated = original + "d"

    updated shouldBe arr("a", "b", "c", "d")
    original shouldBe arr("a", "b", "c")
  }

  test("removing an existing element returns a new array without that element") {
    val original = arr("apple", "banana", "cherry")

    val updated = original - "banana"

    updated shouldBe arr("apple", "cherry")
    original shouldBe arr("apple", "banana", "cherry")
  }

  test("remove(element) behaves the same as -(element)") {
    val original = arr("x", "y", "z")

    original.remove("y") shouldBe (original - "y")
  }

  test("removing a non-existing element returns an unchanged array") {
    val original = arr("one", "two", "three")

    val updated = original - "missing"

    updated shouldBe original
  }

  test("concatenation ++ returns a new array combining both") {
    val a = arr("hello", "world")
    val b = arr("foo", "bar")

    val combined = a ++ b

    combined shouldBe arr("hello", "world", "foo", "bar")
  }

  test("concatenation with pending removals ++ returns a new array combining both") {
    val a = arr("hello", "world", "it's", "mikey")
    val b = a.remove("it's")
    val c = b.remove("mikey")
    val d = arr("foo", "bar")

    val combined = c ++ d

    combined shouldBe arr("hello", "world", "foo", "bar")
  }

  test("addAll behaves the same as ++") {
    val a = arr("left", "right")
    val b = arr("up", "down")

    a.addAll(b) shouldBe (a ++ b)
  }

  test("apply retrieves the correct element") {
    val a = arr("cat", "dog", "mouse")
    a(1) shouldBe "dog"

    val b = a.remove("dog")
    b(1) shouldBe "mouse"
  }

  test("indexOf returns the correct index or -1 if missing") {
    val a = arr("sun", "moon", "stars")

    a.indexOf("moon") shouldBe 1
    a.indexOf("galaxy") shouldBe -1
  }

  test("contains returns true only when the element exists") {
    val a = arr("red", "green", "blue")

    a.contains("green") shouldBe true
    a.contains("purple") shouldBe false
  }

  test("length returns the number of elements") {
    arr("a", "b", "c").length shouldBe 3
    arr().length shouldBe 0
  }

  test("set returns a new array with the element replaced at the index") {
    val original = arr("first", "second", "third")

    val updated = original.set(1, "SECOND")

    updated shouldBe arr("first", "SECOND", "third")
    original shouldBe arr("first", "second", "third")
  }

  test("remove(index) returns a new array without the element at that index") {
    val original = arr("top", "middle", "bottom")

    val updated = original.remove(1)

    updated shouldBe arr("top", "bottom")
    original shouldBe arr("top", "middle", "bottom")
  }

  test("Iterable behavior: foreach, map, etc. should work") {
    val a = arr("x", "y", "z")


    a.toList shouldBe List("x", "y", "z")
    a.map(_.toUpperCase).toList shouldBe List("X", "Y", "Z")

    val b = a.remove("y")

    b.toList shouldBe List("x", "z")
    b.map(_.toUpperCase).toList shouldBe List("X", "Z")
  }

  test("check removal of all rows by index and that compaction doesn't break things") {
    val count = 10_000
    val numbers = (0 until count).map(_.toString)
    var array = arr(numbers: _*)

    var index = 0
    while (index < count) {
      array.length shouldEqual (count - index)
      array(0) shouldEqual index.toString
      array(array.length - 1) shouldEqual (count -1).toString

      array = array.remove(0)

      array.length shouldEqual (count - index - 1)
      if (array.nonEmpty) {
        array(0) shouldEqual (index + 1).toString
        array(array.length - 1) shouldEqual (count -1).toString
      }

      index += 1
    }
  }

  test("check removal of all rows by last element and that compaction doesn't break things") {
    val count = 10_000
    val numbers = (0 until count).map(_.toString)
    var array = arr(numbers: _*)

    var index = 0
    while (index < count) {
      array.length shouldEqual (count - index)
      array(array.length - 1) shouldEqual (array.length - 1).toString

      array = array.remove(array(array.length - 1))

      array.length shouldEqual (count - index - 1)
      if (array.nonEmpty) {
        array(array.length - 1) shouldEqual (array.length - 1).toString
      }

      index += 1
    }
  }

  test("check equals and hashcode") {

    val numbers = (0 to 100000).map(_.toString)

    val array1 = arr(numbers: _*)
    val array2 = arr(numbers: _*)
    val array3 = arr(numbers.slice(0, 100): _*)

    array1 shouldEqual array1

    array1 shouldEqual array2
    array1.hashCode() shouldEqual array2.hashCode()

    array1 should not equal array3
  }

}

object BuildBigGroupByTestMain {

  def main(args: Array[String]): Unit = {
    val count = 100_000
    val numbers = (0 until count).map(_.toString).toArray
    var array = ImmutableArray.from(numbers)

    def doRemoval(): Unit = {
      var index = 0
      while (index < count) {
        

        array = array.remove(array(array.length - 1))

        index += 1
      }
    }

    doRemoval()
  }
}