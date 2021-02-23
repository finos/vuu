package io.venuu.vuu.core.index

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.ImmutableArray
import io.venuu.vuu.core.table.{DataType, SimpleColumn}
import org.scalatest.{FeatureSpec, Matchers}

class IndexedFieldTest extends FeatureSpec with Matchers with StrictLogging {

  feature("test the creation and querying of indexed fields") {

    scenario("Index the parent order id from a table of child orders for fast access") {

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
    }

    scenario("Create a string based index using SkipList") {

      val index = new SkipListIndexedStringField(new SimpleColumn("ric", 0, DataType.StringDataType))

      val rics = List("AAPL", "MSFT", "VOD.L", "BT.L", "BP.L", "FLOW.AS")

      rics.foreach(ric => {
        (0 to 5).foreach(i => index.insert(ric, ric + i.toString))
      })

      val values = index.find("BT.L")

      values.toList shouldEqual (List("BT.L0", "BT.L1", "BT.L2", "BT.L3", "BT.L4", "BT.L5"))

      index.remove("BT.L", "BT.L5")

      val values2 = index.find("BT.L")

      values2.toList shouldEqual (List("BT.L0", "BT.L1", "BT.L2", "BT.L3", "BT.L4"))
    }

    scenario("Check less than on an int index"){

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

    scenario("Check greater than on an int index"){

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
  }
}
