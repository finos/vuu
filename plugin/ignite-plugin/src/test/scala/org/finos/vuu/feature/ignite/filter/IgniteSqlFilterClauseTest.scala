package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.core.table.SimpleColumn
import org.finos.vuu.feature.ignite.IgniteSqlQuery
import org.finos.vuu.feature.ignite.filter.IgniteSqlFilterClauseTest.schemaMapperWithGivenFields
import org.finos.vuu.util.schema.{ExternalEntitySchema, SchemaField, SchemaMapperBuilder}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class IgniteSqlFilterClauseTest extends AnyFeatureSpec with Matchers {

  Feature(s"RegexIgniteSqlFilterClause[RegexOp.Starts]}") {
    val schemaMapper = schemaMapperWithGivenFields(("tag", classOf[String]), ("age", classOf[Int]))

    Scenario("should return correct query when simple value passed") {
      val clause = RegexIgniteSqlFilterClause(RegexOp.Starts)("tag", "To")

      val result = clause.toSql(schemaMapper)

      result shouldEqual IgniteSqlQuery("tag LIKE ? ESCAPE ?", List("To%", "\\"))
    }

    Scenario("should return correct query with escaped special chars when value with special chars passed") {
      val clause = RegexIgniteSqlFilterClause(RegexOp.Starts)("tag", "100%_off\\")

      val result = clause.toSql(schemaMapper)

      result shouldEqual IgniteSqlQuery("tag LIKE ? ESCAPE ?", List("100\\%\\_off\\\\%", "\\"))
    }

    Scenario("should return empty query when non-string column") {
      val clause = RegexIgniteSqlFilterClause(RegexOp.Starts)("age", "15")

      val result = clause.toSql(schemaMapper)

      result shouldEqual IgniteSqlQuery.empty
    }

    Scenario("should return empty query when no mapped field found") {
      val clause = RegexIgniteSqlFilterClause(RegexOp.Starts)("tagged", "To")

      val result = clause.toSql(schemaMapper)

      result shouldEqual IgniteSqlQuery.empty
    }

    Scenario("should return expected string representation") {
      RegexIgniteSqlFilterClause(RegexOp.Starts)("tag", "abc").toString shouldEqual "RegexIgniteSqlFilterClause[Starts](tag, abc)"
    }
  }

  Feature(s"RegexIgniteSqlFilterClause[RegexOp.Ends]}") {
    val schemaMapper = schemaMapperWithGivenFields(("tag", classOf[String]), ("age", classOf[Int]))

    Scenario("should return correct query when simple value passed") {
      val clause = RegexIgniteSqlFilterClause(RegexOp.Ends)("tag", "To")

      val result = clause.toSql(schemaMapper)

      result shouldEqual IgniteSqlQuery("tag LIKE ? ESCAPE ?", List("%To", "\\"))
    }

    Scenario("should return correct query with escaped special chars when value with special chars passed") {
      val clause = RegexIgniteSqlFilterClause(RegexOp.Ends)("tag", "100%_off\\")

      val result = clause.toSql(schemaMapper)

      result shouldEqual IgniteSqlQuery("tag LIKE ? ESCAPE ?", List("%100\\%\\_off\\\\", "\\"))
    }

    Scenario("should return empty query when non-string column") {
      val clause = RegexIgniteSqlFilterClause(RegexOp.Ends)("age", "15")

      val result = clause.toSql(schemaMapper)

      result shouldEqual IgniteSqlQuery.empty
    }

    Scenario("should return empty query when no mapped field found") {
      val clause = RegexIgniteSqlFilterClause(RegexOp.Ends)("tagged", "To")

      val result = clause.toSql(schemaMapper)

      result shouldEqual IgniteSqlQuery.empty
    }

    Scenario("should return expected string representation") {
      RegexIgniteSqlFilterClause(RegexOp.Ends)("tag", "abc").toString shouldEqual "RegexIgniteSqlFilterClause[Ends](tag, abc)"
    }
  }

  Feature(s"RegexIgniteSqlFilterClause[RegexOp.Contains]}") {
    val schemaMapper = schemaMapperWithGivenFields(("tag", classOf[String]), ("age", classOf[Int]))

    Scenario("should return correct query when simple value passed") {
      val clause = RegexIgniteSqlFilterClause(RegexOp.Contains)("tag", "gold")

      val result = clause.toSql(schemaMapper)

      result shouldEqual IgniteSqlQuery("tag LIKE ? ESCAPE ?", List("%gold%", "\\"))
    }

    Scenario("should return correct query with escaped special chars when value with special chars passed") {
      val clause = RegexIgniteSqlFilterClause(RegexOp.Contains)("tag", "\\100%_off\\")

      val result = clause.toSql(schemaMapper)

      result shouldEqual IgniteSqlQuery("tag LIKE ? ESCAPE ?", List("%\\\\100\\%\\_off\\\\%", "\\"))
    }

    Scenario("should return empty query when non-string column") {
      val clause = RegexIgniteSqlFilterClause(RegexOp.Contains)("age", "15")

      val result = clause.toSql(schemaMapper)

      result shouldEqual IgniteSqlQuery.empty
    }

    Scenario("should return empty query when no mapped field found") {
      val clause = RegexIgniteSqlFilterClause(RegexOp.Contains)("tagged", "To")

      val result = clause.toSql(schemaMapper)

      result shouldEqual IgniteSqlQuery.empty
    }

    Scenario("should return expected string representation") {
      RegexIgniteSqlFilterClause(RegexOp.Contains)("tag", "abc").toString shouldEqual "RegexIgniteSqlFilterClause[Contains](tag, abc)"
    }
  }
}

private object IgniteSqlFilterClauseTest {
  private def schemaMapperWithGivenFields(fields: (String, Class[_])*) = {
    val fieldsAndColumns = fields.toList.zipWithIndex.map({case ((name, dataType), idx) =>
      (SchemaField(name, dataType, idx), SimpleColumn(name, idx, dataType))
    })

    SchemaMapperBuilder(externalSchema(fieldsAndColumns.map(_._1)), fieldsAndColumns.map(_._2).toArray).build()
  }

  private def externalSchema(fields: List[SchemaField]) = TestSchema(fields)

  private case class TestSchema(override val fields: List[SchemaField]) extends ExternalEntitySchema
}