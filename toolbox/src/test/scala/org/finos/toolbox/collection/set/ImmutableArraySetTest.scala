package org.finos.toolbox.collection.set

import org.scalatest.funsuite.AnyFunSuite
import org.scalatest.matchers.should.Matchers

class ImmutableArraySetTest extends AnyFunSuite with Matchers {

  def set(xs: String*): ImmutableArraySet[String] = ImmutableArraySet.from(xs.toArray)

  test("adding a new element returns a new set and preserves the original") {
    val original = set("a", "b", "c")

    val updated = original + "d"

    updated shouldBe set("a", "b", "c", "d")
    original shouldBe set("a", "b", "c")
  }

  test("adding an existing element returns the same set") {
    val original = set("x", "y", "z")

    val updated = original + "y"

    updated shouldBe original
  }

  test("removing an existing element returns a new set without that element") {
    val original = set("apple", "banana", "cherry")

    val updated = original - "banana"

    updated shouldBe set("apple", "cherry")
    original shouldBe set("apple", "banana", "cherry")
  }

  test("removing a non-existing element returns the same set") {
    val original = set("one", "two", "three")

    val updated = original - "missing"

    updated shouldBe original
  }

  test("remove(element) behaves the same as -(element)") {
    val original = set("x", "y", "z")

    original.remove("y") shouldBe (original - "y")
  }

  test("concatenation ++ merges sets and removes duplicates") {
    val a = set("hello", "world")
    val b = set("world", "foo", "bar")

    val combined = a ++ b

    combined shouldBe set("hello", "world", "foo", "bar")
  }

  test("addAll behaves the same as ++") {
    val a = set("left", "right")
    val b = set("right", "up", "down")

    a.addAll(b) shouldBe (a ++ b)
  }

  test("contains returns true only when the element exists") {
    val s = set("red", "green", "blue")

    s.contains("green") shouldBe true
    s.contains("purple") shouldBe false
  }

  test("length returns the number of unique elements") {
    set("a", "b", "c").length shouldBe 3
    set("a", "a", "a").length shouldBe 1
    set().length shouldBe 0
  }

  test("Iterable behavior: foreach, map, etc. should work") {
    val s = set("x", "y", "z")

    s.toList shouldBe List("x", "y", "z")
    s.map(_.toUpperCase).toList shouldBe List("X", "Y", "Z")
  }

  test("check equals and hashcode") {

    val numbers = (0 to 100000).map(_.toString)

    val array1 = set(numbers: _*)
    val array2 = set(numbers: _*)
    val array3 = set(numbers.slice(0, 100): _*)

    array1 shouldEqual array1

    array1 shouldEqual array2
    array1.hashCode() shouldEqual array2.hashCode()

    array1 should not equal array3
  }

}
