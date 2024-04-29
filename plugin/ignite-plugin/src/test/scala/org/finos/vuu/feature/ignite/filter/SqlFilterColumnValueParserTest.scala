package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.table.Columns
import org.finos.vuu.feature.ignite.filter.SqlFilterColumnValueParser.ParsedResult
import org.finos.vuu.util.schema.{ExternalEntitySchemaBuilder, SchemaField, SchemaMapperBuilder}
import org.finos.vuu.util.types.TypeConverterContainerBuilder
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.sql.Date

class SqlFilterColumnValueParserTest extends AnyFeatureSpec with Matchers {
  private val columns = Columns.fromNames("date".long(), "name".string(), "quantity".string())
  private val externalSchema = ExternalEntitySchemaBuilder()
    .withField("date", classOf[Date])
    .withField("name", classOf[String])
    .withField("quantity", classOf[Long])
    .build()


  private val tcContainer = TypeConverterContainerBuilder()
    .with2WayConverter[Long, Date](classOf[Long], classOf[Date], new Date(_), _.getTime)
    .build()


  private val schemaMapper = SchemaMapperBuilder(externalSchema, columns)
    .withTypeConverters(tcContainer)
    .build()

  private val toStringContainer = SqlStringConverterContainerBuilder()
    .withToString[Date](classOf[Date], d => s"'${d.toString}'") // overriding default toString
    .build()

  private val parser = SqlFilterColumnValueParser(schemaMapper, toStringContainer)

  Feature("parseColumnValue") {
    Scenario("should correctly parse valid column value with user-passed toString applied") {
      val res = parser.parseColumnValue("date", s"${Date.valueOf("2024-02-10").getTime}")

      res.toOption.get shouldEqual ParsedResult(SchemaField("date", classOf[Date], 0), "'2024-02-10'")
    }

    Scenario("should return error when column not found in the mapper") {
      val res = parser.parseColumnValue("not-present", "some-value")

      res.isLeft shouldBe true
    }

    Scenario("should return error when unable to parse column value from String to column DataType") {
      val res = parser.parseColumnValue("date", "not-a-long")

      res.isLeft shouldBe true
    }

    Scenario("should return error when unable to convert column value from column DataType to external field DataType") {
      val res = parser.parseColumnValue("quantity", "not-a-long")

      res.isLeft shouldBe true
    }

    Scenario("should return error when SQL injection noticed") {
      val res = parser.parseColumnValue("name", "abc'; DROP TABLE A; --")

      res.isLeft shouldBe true
    }
  }

  Feature("parseColumnValues") {
    Scenario("should correctly parse valid column values with user-passed toString applied") {
      val res = parser.parseColumnValues(
        "date",
        List(
          s"${Date.valueOf("2024-02-10").getTime}",
          s"${Date.valueOf("2024-02-12").getTime}"
        )
      )

      res.toOption.get shouldEqual ParsedResult(
        SchemaField("date", classOf[Date], 0), List("'2024-02-10'", "'2024-02-12'")
      )
    }

    Scenario("should return successfully parsed values in case parsing error occurs for some but not all") {
      val res = parser.parseColumnValues("quantity", List("123", "not-a-long", "321"))

      res.toOption.get shouldEqual ParsedResult(
        SchemaField("quantity", classOf[Long], 2), List("123", "321")
      )
    }

    Scenario("should return error when column not found in the mapper") {
      val res = parser.parseColumnValues("not-present", List("some-value"))

      res.isLeft shouldBe true
    }

    Scenario("should return error when unable to parse all values") {
      val res = parser.parseColumnValues("quantity", List("another-not-a-long", "not-a-long"))

      res.isLeft shouldBe true
    }
  }

}
