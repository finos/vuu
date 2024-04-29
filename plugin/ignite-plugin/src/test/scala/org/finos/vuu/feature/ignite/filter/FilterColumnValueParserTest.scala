package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.table.Columns
import org.finos.vuu.feature.ignite.filter.FilterColumnValueParser.ParsedResult
import org.finos.vuu.util.schema.{ExternalEntitySchemaBuilder, SchemaField, SchemaMapperBuilder}
import org.finos.vuu.util.types.TypeConverterContainerBuilder
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.sql.Date

class FilterColumnValueParserTest extends AnyFeatureSpec with Matchers {
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

  private val parser = FilterColumnValueParser(schemaMapper)

  Feature("parse(String, String)") {
    Scenario("should correctly parse valid column value with user-passed toString applied") {
      val timestamp = Date.valueOf("2024-02-10").getTime

      val res = parser.parse("date", s"$timestamp")

      res.toOption.get shouldEqual ParsedResult(SchemaField("date", classOf[Date], 0), Date.valueOf("2024-02-10"))
    }

    Scenario("should return error when column not found in the mapper") {
      val res = parser.parse("not-present", "some-value")

      res.isLeft shouldBe true
    }

    Scenario("should return error when unable to parse column value from String to column DataType") {
      val res = parser.parse("date", "not-a-long")

      res.isLeft shouldBe true
    }

    Scenario("should return error when unable to convert column value from column DataType to external field DataType") {
      val res = parser.parse("quantity", "not-a-long")

      res.isLeft shouldBe true
    }
  }

  Feature("parse(String, List[String])") {
    Scenario("should correctly parse valid column values with user-passed toString applied") {
      val timestamp1 = Date.valueOf("2024-02-10").getTime
      val timestamp2 = Date.valueOf("2024-02-12").getTime

      val res = parser.parse("date", List(s"$timestamp1", s"$timestamp2"))

      res.toOption.get shouldEqual ParsedResult(
        SchemaField("date", classOf[Date], 0), List(Date.valueOf("2024-02-10"), Date.valueOf("2024-02-12"))
      )
    }

    Scenario("should return successfully parsed values in case parsing error occurs for some but not all") {
      val res = parser.parse("quantity", List("123", "not-a-long", "321"))

      res.toOption.get shouldEqual ParsedResult(SchemaField("quantity", classOf[Long], 2), List(123, 321))
    }

    Scenario("should return error when column not found in the mapper") {
      val res = parser.parse("not-present", List("some-value"))

      res.isLeft shouldBe true
    }

    Scenario("should return error when unable to parse all values") {
      val res = parser.parse("quantity", List("first-not-a-long", "second-not-a-long"))

      res.isLeft shouldBe true
    }
  }

}
