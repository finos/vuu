package org.finos.vuu.core.index

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.core.table.{DataType, SimpleColumn}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class IndexedFieldTest extends AnyFeatureSpec with Matchers with StrictLogging {

  Feature("test the creation and querying of indexed fields") {

    Scenario("Index the parent order id from a table of child orders for fast access") {

      val index = new SkipListIndexedIntField(new SimpleColumn("parentOrderId", 0, DataType.IntegerDataType))

      (0 to 9).foreach(parentOrderId => {
        val firstChildId = 1000 + (100 * parentOrderId)

        (firstChildId to firstChildId + 9).foreach(childOrderId => {
          index.insert(parentOrderId, childOrderId.toString)
        })

      })

      val rowKeys = index.find(3)

      rowKeys(0) shouldEqual ("1300")
      rowKeys(1) shouldEqual ("1301")
      rowKeys(2) shouldEqual ("1302")
      rowKeys(9) shouldEqual ("1309")
      rowKeys.length shouldEqual (10)

      index.remove(3, "1302")

      val rowKeys2 = index.find(3)

      rowKeys2.length shouldEqual (9)
      rowKeys2.indexOf("1302") shouldEqual(-1)
      rowKeys2.contains("1302") shouldBe false
    }

    Scenario("Create a string based index using HashMap") {

      val index = new HashMapIndexedStringField(new SimpleColumn("text", 0, DataType.StringDataType))

      val key1 = "AaBB"
      val key2 = "BBAa"
      
      key1.hashCode shouldEqual key2.hashCode //We want to make sure hashcode clashes are handled
      
      val values = List(key1, key2) 
      
      values.foreach(value => {
        (0 to 5).foreach(i => index.insert(value, value + i.toString))
      })

      val results = index.find(key1)

      results.toList shouldEqual List("AaBB0", "AaBB1", "AaBB2", "AaBB3", "AaBB4", "AaBB5")

      index.remove(key1, "AaBB5")

      val results2 = index.find(key1)

      results2.toList shouldEqual List("AaBB0", "AaBB1", "AaBB2", "AaBB3", "AaBB4")

      val results3 = index.find("lolcats")

      results3.length shouldEqual 0

      val results4 = index.find(List(key1, key2, "lolcats"))

      results4.toList shouldEqual List("AaBB0", "AaBB1", "AaBB2", "AaBB3", "AaBB4", "BBAa0", "BBAa1", "BBAa2", "BBAa3", "BBAa4", "BBAa5")

      val results5 = index.find(List())

      results5.isEmpty shouldBe true

      val results6 = index.find(List(key2))

      results6.toList shouldEqual List("BBAa0", "BBAa1", "BBAa2", "BBAa3", "BBAa4", "BBAa5")

    }

    Scenario("Check less than on an int index"){

      val index = new SkipListIndexedIntField(new SimpleColumn("parentOrderId", 0, DataType.IntegerDataType))

      index.insert(100, "ORDER-1")
      index.insert(200, "ORDER-2")
      index.insert(300, "ORDER-3")
      index.insert(400, "ORDER-4")
      index.insert(500, "ORDER-5")
      index.insert(250, "ORDER-6")
      index.insert(275, "ORDER-7")

      index.lessThan(400).toArray.sorted shouldEqual(Array("ORDER-1","ORDER-2", "ORDER-3", "ORDER-6", "ORDER-7"))
    }

    Scenario("Check greater than on an int index"){

      val index = new SkipListIndexedIntField(new SimpleColumn("parentOrderId", 0, DataType.IntegerDataType))

      index.insert(100, "ORDER-1")
      index.insert(200, "ORDER-2")
      index.insert(300, "ORDER-3")
      index.insert(400, "ORDER-4")
      index.insert(500, "ORDER-5")
      index.insert(250, "ORDER-6")
      index.insert(275, "ORDER-7")

      index.greaterThan(400).toArray.sorted shouldEqual(Array("ORDER-5"))
      index.greaterThanOrEqual(400).toArray.sorted shouldEqual(Array("ORDER-4", "ORDER-5"))
    }

    Scenario("Create a EpochTimestamp based index using SkipList") {

      val index = new SkipListIndexedEpochTimestampField(SimpleColumn("Timestamp", 0, DataType.EpochTimestampType))

      val times = List(EpochTimestamp(1), EpochTimestamp(2), EpochTimestamp(3), EpochTimestamp(4), EpochTimestamp(5), EpochTimestamp(6))

      times.foreach(time => {
        (0 to 5).foreach(i => index.insert(time, time.toString + i.toString))
      })

      val values = index.find(EpochTimestamp(1))

      values.toList shouldEqual List("10", "11", "12", "13", "14", "15")

      index.remove(EpochTimestamp(1), "15")

      val values2 = index.find(EpochTimestamp(1))

      values2.toList shouldEqual List("10", "11", "12", "13", "14")

      val values3 = index.find(EpochTimestamp(-1))

      values3.toList shouldEqual List()

      val values4 = index.find(List(EpochTimestamp(2), EpochTimestamp(3)))

      values4.toList shouldEqual List("20", "21", "22", "23", "24", "25", "30", "31", "32", "33", "34", "35")
    }

    Scenario("Check ordered operations on EpochTimestamp index") {

      val index = new SkipListIndexedEpochTimestampField(SimpleColumn("Timestamp", 0, DataType.EpochTimestampType))

      val times = List(EpochTimestamp(1), EpochTimestamp(2), EpochTimestamp(3), EpochTimestamp(4), EpochTimestamp(5), EpochTimestamp(6))

      times.foreach(time => {
        (0 to 5).foreach(i => index.insert(time, time.toString + i.toString))
      })

      var values = index.greaterThan(EpochTimestamp(5))
      values.toSet shouldEqual Set("60", "61", "62", "63", "64", "65")

      values = index.greaterThanOrEqual(EpochTimestamp(5))
      values.toSet shouldEqual Set("60", "61", "62", "63", "64", "65", "50", "51", "52", "53", "54", "55")

      values = index.lessThan(EpochTimestamp(2))
      values.toSet shouldEqual Set("10", "11", "12", "13", "14", "15")

      values = index.lessThanOrEqual(EpochTimestamp(2))
      values.toSet shouldEqual Set("20", "21", "22", "23", "24", "25", "10", "11", "12", "13", "14", "15")

    }
  }
}
