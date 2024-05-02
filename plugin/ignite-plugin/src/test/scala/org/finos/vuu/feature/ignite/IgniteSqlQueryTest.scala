package org.finos.vuu.feature.ignite

import org.finos.vuu.feature.ignite.IgniteSqlQuery.QuerySeparator
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class IgniteSqlQueryTest extends AnyFeatureSpec with Matchers {

  Feature("appendSql") {
    val query = IgniteSqlQuery("SELECT * FROM TABLE")

    Scenario("should return new query with appended sql using the specified separator") {
      val newQuery = query.appendSql("ORDER BY id", QuerySeparator.SPACE)

      newQuery.sqlTemplate shouldEqual (query.sqlTemplate + " ORDER BY id")
    }

    Scenario("should return sql unchanged if passed sql is empty") {
      val newQuery = query.appendSql("", sep = QuerySeparator.OR)

      newQuery.sqlTemplate shouldEqual query.sqlTemplate
    }
  }

  Feature("prependSql") {
    val query = IgniteSqlQuery("ORDER BY id")

    Scenario("should return new query with prepended sql using the specified separator") {
      val newQuery = query.prependSql("SELECT * FROM TABLE", QuerySeparator.SPACE)

      newQuery.sqlTemplate shouldEqual ("SELECT * FROM TABLE " + query.sqlTemplate)
    }

    Scenario("should return sql unchanged if passed sql is empty") {
      val newQuery = query.prependSql("", sep = QuerySeparator.OR)

      newQuery.sqlTemplate shouldEqual query.sqlTemplate
    }
  }

  Feature("appendQuery") {
    val query = IgniteSqlQuery("SELECT * FROM ?", "TABLE_2")

    Scenario("should return new joined query with the specified separator") {
      val query2 = IgniteSqlQuery("WHERE id = ?", 23)

      val joinedQuery = query.appendQuery(query2, QuerySeparator.SPACE)

      joinedQuery.sqlTemplate shouldEqual "SELECT * FROM ? WHERE id = ?"
      joinedQuery.args shouldEqual List("TABLE_2", 23)
    }

    Scenario("should be able to append query with multiple args") {
      val query2 = IgniteSqlQuery("WHERE id = ? OR id = ?", List(23, 25))

      val joinedQuery = query.appendQuery(query2, QuerySeparator.SPACE)

      joinedQuery.sqlTemplate shouldEqual "SELECT * FROM ? WHERE id = ? OR id = ?"
      joinedQuery.args shouldEqual List("TABLE_2", 23, 25)
    }
  }

  Feature("appendArgs") {
    val query = IgniteSqlQuery("SELECT * FROM ?", "TABLE2")

    Scenario("should return new query with appended args") {
      val args = List(1, "string", 'A')

      val newQuery = query.appendArgs(args)

      newQuery shouldEqual IgniteSqlQuery(query.sqlTemplate, query.args ++ args)
    }
  }

  Feature("isEmpty") {
    Scenario("should return true when both sqlTemplate and args are empty") {
      val query = IgniteSqlQuery("", List.empty)

      query.isEmpty shouldBe true
    }

    Scenario("should return false when sqlTemplate is not empty") {
      val query = IgniteSqlQuery("A", List.empty)

      query.isEmpty shouldBe false
    }

    Scenario("should return false when sqlTemplate is empty but args is not") {
      val query = IgniteSqlQuery("", "A")

      query.isEmpty shouldBe false
    }
  }

  Feature("toString") {
    Scenario("should return expected string representation of the object") {
      val query = IgniteSqlQuery("SELECT * FROM ?", "TABLE2")

      query.toString shouldEqual "IgniteSqlQuery(SELECT * FROM ?,List(TABLE2))"
    }
  }

}
