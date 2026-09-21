package org.finos.vuu.plugin.clickhouse.provider.data

import com.clickhouse.client.api.query.GenericRecord
import org.finos.vuu.core.table.DataType
import org.finos.vuu.core.table.datatype.{EpochTimestamp, EpochTimestampNano, ScaledDecimal2, ScaledDecimal4, ScaledDecimal6, ScaledDecimal8}
import org.finos.vuu.plugin.virtualized.api.{SimpleVirtualizedSessionTableDef, VirtualizedSessionTableColumn}
import org.mockito.Mockito.when
import org.scalatest.GivenWhenThen
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar

import java.time.{Instant, ZoneId, ZonedDateTime}

class ClickHouseRowDataMapperTest extends AnyFlatSpec with Matchers with MockitoSugar with GivenWhenThen {
  behavior of "ClickHouseRowDataMapper (per-type tests)"

  private def col(name: String, dataType: Class[_]): VirtualizedSessionTableColumn =
    VirtualizedSessionTableColumn(name, 0, dataType, name)

  it should "map non-empty String and omit empty String" in {
    Given("a GenericRecord with a string column and primary key")
    val v1 = mock[GenericRecord]

    val columns = Array(
      col("strCol", DataType.StringDataType),
      col("emptyStrCol", DataType.StringDataType)
    )

    val tableDef = SimpleVirtualizedSessionTableDef(
      tableName = "test",
      tableKeyField = "pk",
      remoteColumns = columns
    )

    when(v1.hasValue("strCol")).thenReturn(true)
    when(v1.hasValue("emptyStrCol")).thenReturn(true)
    when(v1.getString("strCol")).thenReturn("hello")
    when(v1.getString("emptyStrCol")).thenReturn("")
    when(v1.getString("pk")).thenReturn("key-1")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper(tableDef)
    val row = mapper.mapRowData(v1)

    Then("only the non-empty string should be present")
    row.key shouldBe "key-1"
    row.data("strCol") shouldBe "hello"
    row.data.contains("emptyStrCol") shouldBe false
  }

  it should "omit Int when sentinel and include normal Int" in {
    Given("a GenericRecord with integer columns")
    val v1 = mock[GenericRecord]

    val columns = Array(
      col("intCol", DataType.IntegerDataType),
      col("intSentinelCol", DataType.IntegerDataType)
    )

    val tableDef = SimpleVirtualizedSessionTableDef(
      tableName = "test",
      tableKeyField = "pk",
      remoteColumns = columns
    )

    when(v1.hasValue("intCol")).thenReturn(true)
    when(v1.hasValue("intSentinelCol")).thenReturn(true)
    when(v1.getInteger("intCol")).thenReturn(123)
    when(v1.getInteger("intSentinelCol")).thenReturn(ClickHouseRowDataMapper.INT_NAN_SENTINEL)
    when(v1.getString("pk")).thenReturn("key-2")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper(tableDef)
    val row = mapper.mapRowData(v1)

    Then("the normal int is present and sentinel int is omitted")
    row.key shouldBe "key-2"
    row.data("intCol") shouldBe 123
    row.data.contains("intSentinelCol") shouldBe false
  }

  it should "omit Long when sentinel and include normal Long" in {
    Given("a GenericRecord with long columns")
    val v1 = mock[GenericRecord]

    val columns = Array(
      col("longCol", DataType.LongDataType),
      col("longSentinelCol", DataType.LongDataType)
    )

    val tableDef = SimpleVirtualizedSessionTableDef(
      tableName = "test",
      tableKeyField = "pk",
      remoteColumns = columns
    )

    when(v1.hasValue("longCol")).thenReturn(true)
    when(v1.hasValue("longSentinelCol")).thenReturn(true)
    when(v1.getLong("longCol")).thenReturn(9999999999L)
    when(v1.getLong("longSentinelCol")).thenReturn(ClickHouseRowDataMapper.LONG_NAN_SENTINEL)
    when(v1.getString("pk")).thenReturn("key-3")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper(tableDef)
    val row = mapper.mapRowData(v1)

    Then("the normal long is present and sentinel long is omitted")
    row.key shouldBe "key-3"
    row.data("longCol") shouldBe 9999999999L
    row.data.contains("longSentinelCol") shouldBe false
  }

  it should "omit Double when NaN and include normal Double" in {
    Given("a GenericRecord with double columns")
    val v1 = mock[GenericRecord]

    val columns = Array(
      col("doubleCol", DataType.DoubleDataType),
      col("doubleNaNCol", DataType.DoubleDataType)
    )

    val tableDef = SimpleVirtualizedSessionTableDef(
      tableName = "test",
      tableKeyField = "pk",
      remoteColumns = columns
    )

    when(v1.hasValue("doubleCol")).thenReturn(true)
    when(v1.hasValue("doubleNaNCol")).thenReturn(true)
    when(v1.getDouble("doubleCol")).thenReturn(2.718)
    when(v1.getDouble("doubleNaNCol")).thenReturn(ClickHouseRowDataMapper.DOUBLE_NAN_SENTINEL)
    when(v1.getString("pk")).thenReturn("key-4")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper(tableDef)
    val row = mapper.mapRowData(v1)

    Then("the normal double is present and NaN double is omitted")
    row.key shouldBe "key-4"
    row.data("doubleCol") shouldBe 2.718
    row.data.contains("doubleNaNCol") shouldBe false
  }

  it should "include Boolean values" in {
    Given("a GenericRecord with a boolean column")
    val v1 = mock[GenericRecord]

    val columns = Array(col("boolCol", DataType.BooleanDataType))

    val tableDef = SimpleVirtualizedSessionTableDef(
      tableName = "test",
      tableKeyField = "pk",
      remoteColumns = columns
    )

    when(v1.hasValue("boolCol")).thenReturn(true)
    when(v1.getBoolean("boolCol")).thenReturn(true)
    when(v1.getString("pk")).thenReturn("key-5")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper(tableDef)
    val row = mapper.mapRowData(v1)

    Then("the boolean value is present")
    row.key shouldBe "key-5"
    row.data("boolCol") shouldBe true
  }

  it should "map Char only when single-character string provided" in {
    Given("a GenericRecord with char column")
    val v1 = mock[GenericRecord]

    val columns = Array(col("charCol", DataType.CharDataType))

    val tableDef = SimpleVirtualizedSessionTableDef(
      tableName = "test",
      tableKeyField = "pk",
      remoteColumns = columns
    )

    when(v1.hasValue("charCol")).thenReturn(true)
    when(v1.getString("charCol")).thenReturn("A")
    when(v1.getString("pk")).thenReturn("key-6")

    When("we map the record with single-character string")
    val mapper = ClickHouseRowDataMapper(tableDef)
    val row = mapper.mapRowData(v1)

    Then("the char is present")
    row.key shouldBe "key-6"
    row.data("charCol") shouldBe 'A'

    Given("the GenericRecord returns multi-character string")
    val v2 = mock[GenericRecord]
    when(v2.hasValue("charCol")).thenReturn(true)
    when(v2.getString("charCol")).thenReturn("AB")
    when(v2.getString("pk")).thenReturn("key-7")

    When("we map the record again")
    val row2 = mapper.mapRowData(v2)

    Then("the char is omitted")
    row2.key shouldBe "key-7"
    row2.data.contains("charCol") shouldBe false
  }

  it should "map EpochTimestamp only when non 0 zoned datetime provided" in {
    Given("a GenericRecord with zoned date time column")
    val v1 = mock[GenericRecord]

    val columns = Array(col("epochCol", DataType.EpochTimestampType))

    val tableDef = SimpleVirtualizedSessionTableDef(
      tableName = "test",
      tableKeyField = "pk",
      remoteColumns = columns
    )

    when(v1.hasValue("epochCol")).thenReturn(true)
    when(v1.getZonedDateTime("epochCol")).thenReturn(ZonedDateTime.ofInstant(Instant.ofEpochMilli(1), ZoneId.of("UTC")))
    when(v1.getString("pk")).thenReturn("key-6")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper(tableDef)
    val row = mapper.mapRowData(v1)

    Then("the epoch is present")
    row.key shouldBe "key-6"
    row.data("epochCol") shouldBe EpochTimestamp(1)

    Given("the GenericRecord returns null")
    val v2 = mock[GenericRecord]
    when(v2.hasValue("epochCol")).thenReturn(true)
    when(v2.getZonedDateTime("epochCol")).thenReturn(null)
    when(v2.getString("pk")).thenReturn("key-7")

    When("we map the record again")
    val row2 = mapper.mapRowData(v2)

    Then("the epoch is omitted")
    row2.key shouldBe "key-7"
    row2.data.contains("epochCol") shouldBe false

    Given("the GenericRecord returns Unix Epoch 0")
    val v3 = mock[GenericRecord]
    when(v3.hasValue("epochCol")).thenReturn(true)
    when(v3.getZonedDateTime("epochCol")).thenReturn(ZonedDateTime.ofInstant(Instant.EPOCH, ZoneId.of("UTC")))
    when(v3.getString("pk")).thenReturn("key-8")

    When("we map the record again")
    val row3 = mapper.mapRowData(v3)

    Then("the epoch is omitted")
    row3.key shouldBe "key-8"
    row3.data.contains("epochCol") shouldBe false
  }

  it should "map EpochTimestampNano only when non 0 zoned datetime provided" in {
    Given("a GenericRecord with epoch column")
    val v1 = mock[GenericRecord]

    val columns = Array(col("epochNanoCol", DataType.EpochTimestampNanoType))

    val tableDef = SimpleVirtualizedSessionTableDef(
      tableName = "test",
      tableKeyField = "pk",
      remoteColumns = columns
    )

    when(v1.hasValue("epochNanoCol")).thenReturn(true)
    when(v1.getZonedDateTime("epochNanoCol")).thenReturn(ZonedDateTime.ofInstant(Instant.ofEpochMilli(1), ZoneId.of("UTC")))
    when(v1.getString("pk")).thenReturn("key-6")

    When("we map the record with a valid zoned date time")
    val mapper = ClickHouseRowDataMapper(tableDef)
    val row = mapper.mapRowData(v1)

    Then("the timestamp is present")
    row.key shouldBe "key-6"
    row.data("epochNanoCol") shouldBe EpochTimestampNano(1_000_000)

    Given("the GenericRecord returns null")
    val v2 = mock[GenericRecord]
    when(v2.hasValue("epochNanoCol")).thenReturn(true)
    when(v2.getZonedDateTime("epochNanoCol")).thenReturn(null)
    when(v2.getString("pk")).thenReturn("key-7")

    When("we map the record again")
    val row2 = mapper.mapRowData(v2)

    Then("the timestamp is not present")
    row2.key shouldBe "key-7"
    row2.data.contains("epochNanoCol") shouldBe false

    Given("the GenericRecord returns Unix Epoch 0")
    val v3 = mock[GenericRecord]
    when(v3.hasValue("epochNanoCol")).thenReturn(true)
    when(v3.getZonedDateTime("epochNanoCol")).thenReturn(ZonedDateTime.ofInstant(Instant.EPOCH, ZoneId.of("UTC")))
    when(v3.getString("pk")).thenReturn("key-8")

    When("we map the record again")
    val row3 = mapper.mapRowData(v3)

    Then("the timestamp is omitted")
    row3.key shouldBe "key-8"
    row3.data.contains("epochNanoCol") shouldBe false
  }

  it should "map scaled decimals from longs and omit sentinels" in {
    Given("a GenericRecord with epoch and scaled decimal columns")
    val v1 = mock[GenericRecord]

    val columns = Array(
      col("dec2Col", DataType.ScaledDecimal2Type),
      col("dec4Col", DataType.ScaledDecimal4Type),
      col("dec6Col", DataType.ScaledDecimal6Type),
      col("dec8Col", DataType.ScaledDecimal8Type),
      col("decSentinelCol", DataType.ScaledDecimal2Type)
    )

    val tableDef = SimpleVirtualizedSessionTableDef(
      tableName = "test",
      tableKeyField = "pk",
      remoteColumns = columns
    )

    columns.foreach { c =>
      when(v1.hasValue(c.name)).thenReturn(true)
    }

    when(v1.getLong("dec2Col")).thenReturn(250L)
    when(v1.getLong("dec4Col")).thenReturn(25000L)
    when(v1.getLong("dec6Col")).thenReturn(2500000L)
    when(v1.getLong("dec8Col")).thenReturn(250000000L)
    when(v1.getLong("decSentinelCol")).thenReturn(ClickHouseRowDataMapper.LONG_NAN_SENTINEL)
    when(v1.getString("pk")).thenReturn("key-8")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper(tableDef)
    val row = mapper.mapRowData(v1)

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

    val columns = Array(
      col("presentCol", DataType.StringDataType),
      col("missingCol", DataType.IntegerDataType)
    )

    val tableDef = SimpleVirtualizedSessionTableDef(
      tableName = "test",
      tableKeyField = "pk",
      remoteColumns = columns
    )

    when(v1.hasValue("presentCol")).thenReturn(true)
    when(v1.hasValue("missingCol")).thenReturn(false)
    when(v1.getString("presentCol")).thenReturn("ok")
    when(v1.getString("pk")).thenReturn("key-9")

    When("we map the record")
    val mapper = ClickHouseRowDataMapper(tableDef)
    val row = mapper.mapRowData(v1)

    Then("only the present column is included")
    row.key shouldBe "key-9"
    row.data("presentCol") shouldBe "ok"
    row.data.contains("missingCol") shouldBe false
  }
}

