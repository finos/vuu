package org.finos.vuu.core.table.lucene

import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.vuu.api.{DeleteIndexOnShutdown, IndexFilePath, LuceneTableDef, VisualLinks}
import org.finos.vuu.core.table.{Columns, LuceneTable, RowWithData, ViewPortColumnCreator}
import org.finos.vuu.provider.JoinTableProviderImpl
import org.finos.vuu.viewport.TestTimeStamp
import org.apache.lucene.analysis.standard.StandardAnalyzer
import org.apache.lucene.document._
import org.apache.lucene.index.{DirectoryReader, IndexWriter, IndexWriterConfig, Term}
import org.apache.lucene.search.IndexSearcher
import org.apache.lucene.store.MMapDirectory
import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.TestFriendlyClock
import org.scalatest.BeforeAndAfterAll
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.nio.file.Paths

// https://www.xspdf.com/help/52563961.html

//https://stackoverflow.com/questions/15728569/multiple-field-query-handling-in-lucene#15730250
//https://lucenetutorial.com/lucene-query-syntax.html
//http://makble.com/lucene-field-stringfield-vs-textfield


class LuceneTableTest extends AnyFeatureSpec with Matchers with BeforeAndAfterAll {

  private final val indexPath = "target/test/LuceneTableTest"

  override protected def beforeAll(): Unit = {
    Paths.get(indexPath).toAbsolutePath.toFile.mkdir()
  }

  override protected def afterAll(): Unit = {
    Paths.get(indexPath).toAbsolutePath.toFile.deleteOnExit()
  }

  Feature("check creating indexed tables in Lucene"){

    Scenario("Check creation and retrieval of data"){

      implicit val clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
      implicit val lifeCycle = new LifecycleContainer
      implicit val metrics = new MetricsProviderImpl

      val joinTableProvider = JoinTableProviderImpl()

      val tableDef = new LuceneTableDef("executions", "executionId",
        Columns.fromNames("executionId:String", "ric:String", "quantity:Int", "price:Double", "lastExchange:String"),
        Seq("executionId"), false, VisualLinks(), IndexFilePath("target/test"), DeleteIndexOnShutdown)

      val table = new LuceneTable(tableDef, joinTableProvider)

      val rowCount = 10

      val (millis, _ ) = timeIt {
        (0 to rowCount).foreach(i => {
          val execId = "exec" + i
          val ric = "FOO"
          val quantity = i * 100
          val price = (100 - i).toDouble
          val lastExchange = "XLON"

          table.processUpdate(execId, RowWithData(execId, Map(
            "executionId" -> execId,
            "ric" -> ric,
            "quantity" -> quantity,
            "price" -> price,
            "lastExchange" -> lastExchange
          )), clock.now())
        })
      }

      val costPerRow = millis.toDouble / rowCount.toDouble

      val ratePerSecond = (1000).toDouble / costPerRow
      val ratePerMinute = (1000 * 60).toDouble / costPerRow

      println(s"time for $rowCount: " + millis + " millis, per row cost: " + costPerRow + " per sec: " + ratePerSecond + " per min:" + ratePerMinute)

      val array = table.pullRowAsArray("exec0", ViewPortColumnCreator.create(table, tableDef.columns.map(_.name).toList))

      array.size should equal(5)
    }

    ignore("Check Creation of Index Table"){

      val index = new MMapDirectory(Paths.get("target/lucene-index"))
      //val index = new RAMDirectory()

      val analyzer = new StandardAnalyzer
      val config = new IndexWriterConfig(analyzer)
      val indexWriter = new IndexWriter(index, config)

      var document = new Document
      document.add(new TextField("id", "100", Field.Store.YES))
      document.add(new LongPoint("id_as_int", 100l))
      document.add(new TextField("name", "John Doe", Field.Store.YES))
      document.add(new TextField("address", "80 Summer Hill", Field.Store.YES))
      document.add(new IntPoint("age", 10))
      document.add(new DoublePoint("price", 101.23))
      indexWriter.updateDocument(new Term("id", "100"), document)

      val document2 = new Document
      document2.add(new TextField("id", "101", Field.Store.YES))
      document.add(new LongPoint("id_as_int", 101l))
      document2.add(new TextField("name", "Chris Stevenson", Field.Store.YES))
      document2.add(new TextField("address", "20 Bunker Road", Field.Store.YES))
      document2.add(new IntPoint("age", 20))
      document2.add(new DoublePoint("price", 50.01))
      indexWriter.updateDocument(new Term("id", "101"), document2)
      //indexWriter.addDocument(document2)

      val document3 = new Document
      document3.add(new TextField("id", "102", Field.Store.YES))
      document.add(new LongPoint("id_as_int", 102l))
      document3.add(new TextField("name", "Steve The Hero", Field.Store.YES))
      document3.add(new TextField("address", "50 Rompile Road", Field.Store.YES))
      document3.add(new IntPoint("age", 30))
      document3.add(new DoublePoint("price", 34.01))
      indexWriter.updateDocument(new Term("id", "102"), document3)
      //indexWriter.addDocument(document3)

      indexWriter.flush()
      indexWriter.close()

      val reader = DirectoryReader.open(index)
      val searcher = new IndexSearcher(reader)

      //val query = new TermQuery(new Term("name", "chris"))

      val query = IntPoint.newExactQuery("age", 20)
      //val query = new MatchAllDocsQuery

      val topDocs = searcher.search(query, 10)

      println("TopHits:" + topDocs.totalHits.value )

      // Display addresses
      for (scoreDoc <- topDocs.scoreDocs) {
        document = searcher.doc(scoreDoc.doc)
        System.out.println("record=>" + document.get("name") + " " + document.get("address")
          + " " + document.get("age") + " " + document.get("id"))
      }

      //val textQuery = new QueryParser("name", analyzer).parse("chris OR steve")
      //val textQuery = new QueryParser("age", analyzer).parse("age:>10")

      val rangeQuery = IntPoint.newRangeQuery("age", 10, 30)

      val topDocs2 = searcher.search(rangeQuery, 10)

      println("TopHits:" + topDocs2.totalHits.value )

      // Display addresses
      for (scoreDoc <- topDocs2.scoreDocs) {
        document = searcher.doc(scoreDoc.doc)
        System.out.println("next record=>" + document.get("name") + " " + document.get("address")
          + " " + document.get("age") + " " + document.get("id"))
      }

    }
  }


}
