package org.finos.vuu.feature.table.hypertable

import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.toolbox.time.TimeIt.timeIt
import org.scalatest.{BeforeAndAfterEach, GivenWhenThen}
import org.scalatest.featurespec.AnyFeatureSpec

import java.sql.DriverManager

class CreateHyperTableinHyperSqlTest extends AnyFeatureSpec with BeforeAndAfterEach with GivenWhenThen {

  Feature("Create HyperSQL Db") {
    Scenario("Check we can create a raw hyper sql db") {

      implicit val clock = new DefaultClock()

      Class.forName("org.hsqldb.jdbc.JDBCDriver")

      val connection = DriverManager.getConnection("jdbc:hsqldb:file:testdb", "SA", "")

      val stmt = connection.createStatement()

      val createSql =
        """CREATE TABLE test_table (
          |   id INT NOT NULL,
          |   ric VARCHAR(8) NOT NULL,
          |   quantity INT NOT NULL,
          |   create_time BIGINT,
          |   PRIMARY KEY (id) )
          |""".stripMargin

      val result = stmt.executeUpdate(createSql)

      val insertStatment = connection.prepareStatement("INSERT INTO test_table (id, ric, quantity, create_time) values (?,?,?,?)")

      val (time, _) = timeIt{

      (1 to 10_000_000).foreach( i =>{
        insertStatment.setInt(1, i)
        insertStatment.setString(2, "TST.Q")
        insertStatment.setInt(3, i + 100)
        insertStatment.setLong(4, i + 100L)
        insertStatment.execute()
      }
      )
      }

      connection

      val selectStmt = connection.createStatement();

      val rs = selectStmt.executeQuery("SELECT COUNT(1) from test_table")

      rs.next()

      val count = rs.getInt(1)

      println("result = " + count + " in " + time)
    }
  }





}
