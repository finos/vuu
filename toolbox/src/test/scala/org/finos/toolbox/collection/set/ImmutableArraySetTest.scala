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

  test("fromArray removes duplicates and preserves first occurrences") {
    val xs = Array("red", "green", "red", "blue")

    val result = set().fromArray(xs)

    result shouldBe set("red", "green", "blue")
  }

  test("getIndex retrieves the correct element") {
    val s = set("alpha", "beta", "gamma")

    s.getIndex(1) shouldBe "beta"
  }

  test("apply retrieves the correct element") {
    val s = set("cat", "dog", "mouse")

    s(2) shouldBe "mouse"
  }

  test("indexOf returns the index of the element or -1 if missing") {
    val s = set("sun", "moon", "stars")

    s.indexOf("moon") shouldBe 1
    s.indexOf("galaxy") shouldBe -1
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

  test("set(index, element) replaces the element but maintains set semantics") {
    val original = set("first", "second", "third")

    val updated = original.set(1, "SECOND")

    updated shouldBe set("first", "SECOND", "third")
    original shouldBe set("first", "second", "third")
  }

  test("set(index, element) does not introduce duplicates") {
    val original = set("a", "b", "c")

    val updated = original.set(1, "a")

    updated shouldBe set("a", "b", "c") // "a" already exists, "b" left alone
  }

  test("remove(index) removes the element at that index") {
    val original = set("top", "middle", "bottom")

    val updated = original.remove(1)

    updated shouldBe set("top", "bottom")
    original shouldBe set("top", "middle", "bottom")
  }

  test("distinct returns the same set (idempotent)") {
    val original = set("a", "b", "a", "c", "b")

    val distincted = original.distinct

    distincted shouldBe set("a", "b", "c")
  }

  test("Iterable behavior: foreach, map, etc. should work") {
    val s = set("x", "y", "z")

    s.toList shouldBe List("x", "y", "z")
    s.map(_.toUpperCase).toList shouldBe List("X", "Y", "Z")
  }
}
