package io.venuu.vuu.core.table
import io.venuu.toolbox.collection.array.ImmutableArray
import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.vuu.api.{LuceneTableDef, TableDef}
import io.venuu.vuu.core.index.IndexedField
import io.venuu.vuu.provider.JoinTableProvider
import io.venuu.vuu.viewport.RowProcessor
import org.apache.lucene.analysis.standard.StandardAnalyzer
import org.apache.lucene.document.{Document, Field, TextField}
import org.apache.lucene.index.{DirectoryReader, IndexWriter, IndexWriterConfig, Term}
import org.apache.lucene.search.{IndexSearcher, MatchAllDocsQuery, TermQuery}
import org.apache.lucene.store.MMapDirectory

import java.nio.file.Paths

class LuceneTableData(val tableDef: LuceneTableDef){

  private final val rowKeyFieldName = "rowKey"
  private final val lastUpdateFieldName = "lastUpdate"

  private val index = new MMapDirectory(Paths.get(tableDef.indexPath.path))

  private val analyzer = new StandardAnalyzer
  private val config = new IndexWriterConfig(analyzer)
  private val indexWriter = new IndexWriter(index, config)

  private val commitEveryCount = 20
  @volatile
  private var updateCount: Long = 0

  //lazy val reader = DirectoryReader.open(index)
  //lazy val searcher = new IndexSearcher(reader)

  private def rowUpdateAsDocument(rowKey: String, rowUpdate: RowWithData, timeStamp: Long): Unit = {

    val document = new Document

    //val config = new IndexWriterConfig(analyzer)
    //val indexWriter = new IndexWriter(index, config)

    document.add(new TextField(rowKeyFieldName, rowKey, Field.Store.YES))
    document.add(new TextField(lastUpdateFieldName, timeStamp.toString, Field.Store.YES))

    tableDef.columns.foreach( c => {
      rowUpdate.get(c) match {
        case null =>
        case datum: Any =>
          val asString = datum.toString
          document.add(new TextField(c.name, asString, Field.Store.YES))
      }

    })

    indexWriter.addDocument(document)
    if(commitEveryCount % commitEveryCount == 0){
      indexWriter.flush()
      indexWriter.commit()
    }
  }

  def processUpdate(rowKey: String, rowUpdate: RowWithData, timeStamp: Long): Unit = {
    updateCount += 1
    rowUpdateAsDocument(rowKey, rowUpdate, timeStamp)
  }
  def processDelete(rowKey: String): Unit = {
//    indexWriter.deleteDocuments(new Term(rowKeyFieldName, rowKey))
//    indexWriter.flush()
//    indexWriter.commit()
  }

  private def toTerm(field:String, value:String): Term = {
    new Term(field, value)
  }

  def loadDocument(rowKey: String): Document = {
    val reader = DirectoryReader.open(index)
    val searcher = new IndexSearcher(reader)
    val query = new TermQuery(toTerm(rowKeyFieldName, rowKey))
    //val query = new MatchAllDocsQuery

    val topDocs = searcher.search(query, 1)
    if(topDocs.totalHits.value == 0l){
      null
    }else{
      searcher.doc(topDocs.scoreDocs(0).doc)
    }
  }

}

class LuceneTable(val tableDef: LuceneTableDef, val joinProvider: JoinTableProvider)(implicit val metrics: MetricsProvider, val lifecycle: LifecycleContainer) extends DataTable with KeyedObservableHelper[RowKeyUpdate] {

  private val luceneData = new LuceneTableData(tableDef)

  override def indexForColumn(column: Column): Option[IndexedField[_]] = ???

  override def getTableDef: TableDef = tableDef

  override def processUpdate(rowKey: String, rowUpdate: RowWithData, timeStamp: Long): Unit = {
    luceneData.processUpdate(rowKey, rowUpdate, timeStamp)
  }

  override def processDelete(rowKey: String): Unit = {
    luceneData.processDelete(rowKey)
  }

  override def name: String = tableDef.name

  override def notifyListeners(rowKey: String, isDelete: Boolean = false) = {
    getObserversByKey(rowKey).foreach(obs => {
      obs.onUpdate(new RowKeyUpdate(rowKey, this, isDelete))
    })
  }

  override def linkableName: String = tableDef.name

  override def readRow(key: String, columns: List[String], processor: RowProcessor): Unit = ???

  override def primaryKeys: ImmutableArray[String] = ???

  override def pullRow(key: String, columns: List[Column]): RowData = ???

  override def pullRow(key: String): RowData = ???

  override def pullRowAsArray(key: String, columns: List[Column]): Array[Any] = {
    luceneData.loadDocument(key) match {
      case null => Array()
      case doc: Document =>
        columns.map( c => doc.getField(c.name).stringValue() ).toArray
    }
  }

}