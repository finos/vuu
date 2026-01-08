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
    a shouldBe arr("hello", "world")
    b shouldBe arr("foo", "bar")
  }

  test("addAll behaves the same as ++") {
    val a = arr("left", "right")
    val b = arr("up", "down")

    a.addAll(b) shouldBe (a ++ b)
  }

  test("fromArray creates an ImmutableArray with the same elements") {
    val xs = Array("red", "green", "blue")

    val result = arr().fromArray(xs)

    result shouldBe arr("red", "green", "blue")
  }

  test("getIndex retrieves the correct element") {
    val a = arr("alpha", "beta", "gamma")

    a.getIndex(1) shouldBe "beta"
  }

  test("apply retrieves the correct element") {
    val a = arr("cat", "dog", "mouse")

    a(2) shouldBe "mouse"
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

  test("distinct removes duplicates while preserving order") {
    val original = arr("a", "b", "a", "c", "b")

    val distincted = original.distinct

    distincted shouldBe arr("a", "b", "c")
  }

  test("Iterable behavior: foreach, map, etc. should work") {
    val a = arr("x", "y", "z")

    a.toList shouldBe List("x", "y", "z")
    a.map(_.toUpperCase).toList shouldBe List("X", "Y", "Z")
  }
}