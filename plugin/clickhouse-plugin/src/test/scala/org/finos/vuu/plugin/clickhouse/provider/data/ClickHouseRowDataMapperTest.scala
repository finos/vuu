package org.finos.vuu.plugin.clickhouse.provider.data

import com.clickhouse.client.api.metadata.TableSchema
import com.clickhouse.client.api.query.GenericRecord
import org.finos.vuu.core.table.datatype.{EpochTimestamp, ScaledDecimal2, ScaledDecimal4, ScaledDecimal6, ScaledDecimal8}
import org.finos.vuu.core.table.{Column, DataType, SimpleColumn}
import org.scalamock.scalatest.MockFactory
import org.scalatest.GivenWhenThen
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

import java.time.{Instant, ZoneId, ZonedDateTime}

class ClickHouseRowDataMapperTest extends AnyFlatSpec with Matchers with MockFactory with GivenWhenThen {
  behavior of "ClickHouseRowDataMapper (per-type tests)"

  private def col(name: String, dataType: Class[_]): org.finos.vuu.core.table.Column =
    SimpleColumn(name, 0, dataType)

  it should "map non-empty String and omit empty String" in {
    Given("a GenericRecord with a string column and primary key")
    val v1 = mock[GenericRecord]

    val columns = List(
      col("strCol", DataType.StringDataType),
      col("emptyStrCol", DataType.StringDataType)
    )

    (v1.hasValue(_:String)).expects("strCol").returning(true)
    (v1.hasValue(_:String)).expects("emptyStrCol").returning(true)

    (v1.getString(_:String)).expects("strCol").returning("hello")
    (v1.getString(_:String)).expects("emptyStrCol").returning("")
    (v1.getString(_:String)).expects("pk").returning("key-1")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper()
    val row = mapper.mapRowData(v1, "pk", columns)

    Then("only the non-empty string should be present")
    row.key shouldBe "key-1"
    row.data("strCol") shouldBe "hello"
    row.data.contains("emptyStrCol") shouldBe false
  }

  it should "omit Int when sentinel and include normal Int" in {
    Given("a GenericRecord with integer columns")
    val v1 = mock[GenericRecord]

    val columns = List(
      col("intCol", DataType.IntegerDataType),
      col("intSentinelCol", DataType.IntegerDataType)
    )

    (v1.hasValue(_:String)).expects("intCol").returning(true)
    (v1.hasValue(_:String)).expects("intSentinelCol").returning(true)

    (v1.getInteger(_:String)).expects("intCol").returning(123)
    (v1.getInteger(_:String)).expects("intSentinelCol").returning(ClickHouseRowDataMapper.INT_NAN_SENTINEL)
    (v1.getString(_:String)).expects("pk").returning("key-2")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper()
    val row = mapper.mapRowData(v1, "pk", columns)

    Then("the normal int is present and sentinel int is omitted")
    row.key shouldBe "key-2"
    row.data("intCol") shouldBe 123
    row.data.contains("intSentinelCol") shouldBe false
  }

  it should "omit Long when sentinel and include normal Long" in {
    Given("a GenericRecord with long columns")
    val v1 = mock[GenericRecord]

    val columns = List(
      col("longCol", DataType.LongDataType),
      col("longSentinelCol", DataType.LongDataType)
    )

    (v1.hasValue(_:String)).expects("longCol").returning(true)
    (v1.hasValue(_:String)).expects("longSentinelCol").returning(true)
    

    (v1.getLong(_:String)).expects("longCol").returning(9999999999L)
    (v1.getLong(_:String)).expects("longSentinelCol").returning(ClickHouseRowDataMapper.LONG_NAN_SENTINEL)
    (v1.getString(_:String)).expects("pk").returning("key-3")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper()
    val row = mapper.mapRowData(v1, "pk", columns)

    Then("the normal long is present and sentinel long is omitted")
    row.key shouldBe "key-3"
    row.data("longCol") shouldBe 9999999999L
    row.data.contains("longSentinelCol") shouldBe false
  }

  it should "omit Double when NaN and include normal Double" in {
    Given("a GenericRecord with double columns")
    val v1 = mock[GenericRecord]

    val columns = List(
      col("doubleCol", DataType.DoubleDataType),
      col("doubleNaNCol", DataType.DoubleDataType)
    )

    (v1.hasValue(_:String)).expects("doubleCol").returning(true)
    (v1.hasValue(_:String)).expects("doubleNaNCol").returning(true)
    

    (v1.getDouble(_:String)).expects("doubleCol").returning(2.718)
    (v1.getDouble(_:String)).expects("doubleNaNCol").returning(java.lang.Double.NaN)
    (v1.getString(_:String)).expects("pk").returning("key-4")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper()
    val row = mapper.mapRowData(v1, "pk", columns)

    Then("the normal double is present and NaN double is omitted")
    row.key shouldBe "key-4"
    row.data("doubleCol") shouldBe 2.718
    row.data.contains("doubleNaNCol") shouldBe false
  }

  it should "include Boolean values" in {
    Given("a GenericRecord with a boolean column")
    val v1 = mock[GenericRecord]

    val columns = List(col("boolCol", DataType.BooleanDataType))

    (v1.hasValue(_:String)).expects("boolCol").returning(true)
    

    (v1.getBoolean(_:String)).expects("boolCol").returning(true)
    (v1.getString(_:String)).expects("pk").returning("key-5")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper()
    val row = mapper.mapRowData(v1, "pk", columns)

    Then("the boolean value is present")
    row.key shouldBe "key-5"
    row.data("boolCol") shouldBe true
  }

  it should "map Char only when single-character string provided" in {
    Given("a GenericRecord with char column")
    val v1 = mock[GenericRecord]

    val columns = List(col("charCol", DataType.CharDataType))

    (v1.hasValue(_:String)).expects("charCol").returning(true)
    (v1.getString(_:String)).expects("charCol").returning("A")
    (v1.getString(_:String)).expects("pk").returning("key-6")

    When("we map the record with single-character string")
    val mapper = ClickHouseRowDataMapper()
    val row = mapper.mapRowData(v1, "pk", columns)

    Then("the char is present")
    row.key shouldBe "key-6"
    row.data("charCol") shouldBe 'A'

    Given("the GenericRecord returns multi-character string")
    val v2 = mock[GenericRecord]
    (v2.hasValue(_:String)).expects("charCol").returning(true)
    (v2.getString(_:String)).expects("charCol").returning("AB")
    (v2.getString(_:String)).expects("pk").returning("key-7")

    When("we map the record again")
    val row2 = mapper.mapRowData(v2, "pk", columns)

    Then("the char is omitted")
    row2.key shouldBe "key-7"
    row2.data.contains("charCol") shouldBe false
  }

  it should "map EpochTimestamp only when non 0 zoned datetime provided" in {
    Given("a GenericRecord with char column")
    val v1 = mock[GenericRecord]

    val columns = List(col("epochCol", DataType.EpochTimestampType))

    (v1.hasValue(_: String)).expects("epochCol").returning(true)
    (v1.getZonedDateTime(_: String)).expects("epochCol").returning(ZonedDateTime.ofInstant(Instant.ofEpochMilli(1), ZoneId.of("UTC")))
    (v1.getString(_: String)).expects("pk").returning("key-6")

    When("we map the record with single-character string")
    val mapper = ClickHouseRowDataMapper()
    val row = mapper.mapRowData(v1, "pk", columns)

    Then("the char is present")
    row.key shouldBe "key-6"
    row.data("epochCol") shouldBe EpochTimestamp(1)

    Given("the GenericRecord returns null")
    val v2 = mock[GenericRecord]
    (v2.hasValue(_: String)).expects("epochCol").returning(true)
    (v2.getZonedDateTime(_: String)).expects("epochCol").returning(null)
    (v2.getString(_: String)).expects("pk").returning("key-7")

    When("we map the record again")
    val row2 = mapper.mapRowData(v2, "pk", columns)

    Then("the char is omitted")
    row2.key shouldBe "key-7"
    row2.data.contains("epochCol") shouldBe false

    Given("the GenericRecord returns Unix Epoch 0")
    val v3 = mock[GenericRecord]
    (v3.hasValue(_: String)).expects("epochCol").returning(true)
    (v3.getZonedDateTime(_: String)).expects("epochCol").returning(ZonedDateTime.ofInstant(Instant.EPOCH, ZoneId.of("UTC")))
    (v3.getString(_: String)).expects("pk").returning("key-8")

    When("we map the record again")
    val row3 = mapper.mapRowData(v3, "pk", columns)

    Then("the char is omitted")
    row3.key shouldBe "key-8"
    row3.data.contains("epochCol") shouldBe false
  }

  it should "map scaled decimals from longs and omit sentinels" in {
    Given("a GenericRecord with epoch and scaled decimal columns")
    val v1 = mock[GenericRecord]

    val columns = List(
      col("dec2Col", DataType.ScaledDecimal2Type),
      col("dec4Col", DataType.ScaledDecimal4Type),
      col("dec6Col", DataType.ScaledDecimal6Type),
      col("dec8Col", DataType.ScaledDecimal8Type),
      col("decSentinelCol", DataType.ScaledDecimal2Type)
    )

    columns.foreach { c =>
      (v1.hasValue(_:String)).expects(c.name).returning(true)
    }
    

    (v1.getLong(_:String)).expects("dec2Col").returning(250L)
    (v1.getLong(_:String)).expects("dec4Col").returning(25000L)
    (v1.getLong(_:String)).expects("dec6Col").returning(2500000L)
    (v1.getLong(_:String)).expects("dec8Col").returning(250000000L)
    (v1.getLong(_:String)).expects("decSentinelCol").returning(ClickHouseRowDataMapper.LONG_NAN_SENTINEL)
    (v1.getString(_:String)).expects("pk").returning("key-8")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper()
    val row = mapper.mapRowData(v1, "pk", columns)

    Then("epoch and scaled decimals are converted and sentinel omitted")
    row.key shouldBe "key-8"
    row.data("dec2Col") shouldBe ScaledDecimal2(250L)
    row.data("dec4Col") shouldBe ScaledDecimal4(25000L)
    row.data("dec6Col") shouldBe ScaledDecimal6(2500000L)
    row.data("dec8Col") shouldBe ScaledDecimal8(250000000L)
    row.data.contains("decSentinelCol") shouldBe false
  }

  it should "omit columns not present in record" in {
    Given("a GenericRecord which does not contain a column")
    val v1 = mock[GenericRecord]

    val columns = List(
      col("presentCol", DataType.StringDataType),
      col("missingCol", DataType.IntegerDataType)
    )

    (v1.hasValue(_:String)).expects("presentCol").returning(true)
    (v1.hasValue(_:String)).expects("missingCol").returning(false)
    

    (v1.getString(_:String)).expects("presentCol").returning("ok")
    (v1.getString(_:String)).expects("pk").returning("key-9")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper()
    val row = mapper.mapRowData(v1, "pk", columns)

    Then("only the present column is included")
    row.key shouldBe "key-9"
    row.data("presentCol") shouldBe "ok"
    row.data.contains("missingCol") shouldBe false
  }
}

