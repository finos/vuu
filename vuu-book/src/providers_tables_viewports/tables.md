# Tables

Tables are sinks of data. At the lowest form they are wrappers around concurrent maps that offer some value add in propogating updates and deletes for through the system. 

Data tables are represented by the interface io.venuu.vuu.core.table.DataTable in the source code. 

```scala
trait DataTable extends KeyedObservable[RowKeyUpdate] with RowSource {

  @volatile private var provider: Provider = null

  def indexForColumn(column: Column): Option[IndexedField[_]]

  def setProvider(aProvider: Provider): Unit = provider = aProvider

  def getProvider: Provider = provider

  def asTable: DataTable = this

  def columnForName(name: String): Column = getTableDef.columnForName(name)

  def columnsForNames(names: String*): List[Column] = names.map(getTableDef.columnForName(_)).toList

  def columnsForNames(names: List[String]): List[Column] = names.map(getTableDef.columnForName(_))

  def getTableDef: TableDef

  def processUpdate(rowKey: String, rowUpdate: RowWithData, timeStamp: Long): Unit

  def processDelete(rowKey: String): Unit

  def isSelectedVal(key: String, selected: Map[String, Any]): Int = {
    if (selected.contains(key)) 1 else 0
  }

  def size(): Long = {
    primaryKeys.length
  }

  def toAscii(count: Int): String = {
    val columns = getTableDef.columns
    val keys = primaryKeys

    val selectedKeys = keys.toArray.take(count)

    val rows = selectedKeys.map(key => pullRowAsArray(key, columns.toList))

    val columnNames = columns.map(_.name)

    AsciiUtil.asAsciiTable(columnNames, rows)
  }

  def toAscii(start: Int, end: Int): String = {
    val columns = getTableDef.columns
    val keys = primaryKeys

    val selectedKeys = keys.toArray.slice(start, end)//.slice(start, end)//drop(start).take(end - start)

    val rows = selectedKeys.map(key => pullRowAsArray(key, columns.toList))

    val columnNames = columns.map(_.name)

    AsciiUtil.asAsciiTable(columnNames, rows)
  }
}

```

The important methods from this train for these purposes are:

```scala
def processUpdate(...)
def processDelete(...)
```
These are the methods that you call in a provider to populate data into the underlying map. If you go back to the [Providers](providers.md) example you can see it is indeed the update method being called. 

processUpdate functions like an upsert in a SQL data (i.e. it is used for both an insert and an update)

TODO: Add types of tables