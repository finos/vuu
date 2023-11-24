import { SvgDottySeparator } from "@site/src/components/SvgDottySeparator";

# Tables

<SvgDottySeparator style={{marginBottom: 32}}/>

Tables are sinks of data. At the lowest form they are wrappers around concurrent maps that offer some value add in propogating updates and deletes for through the system.

Data tables are represented by the interface org.finos.vuu.core.table.DataTable in the source code.

```scala
trait DataTable extends KeyedObservable[RowKeyUpdate] with RowSource {

  def getTableDef: TableDef

  //<snip/>

  def processUpdate(rowKey: String, rowUpdate: RowWithData, timeStamp: Long): Unit

  def processDelete(rowKey: String): Unit

  def size(): Long = {
    primaryKeys.length
  }

  //<snip/>
}

```

The important methods from this trait for these purposes are:

```scala
def processUpdate(...)
def processDelete(...)
```

These are the methods that you call in a provider to populate data into the underlying map. If you go back to the [Providers](providers.md) example you can see it is indeed the update method being called.

processUpdate functions like an upsert in a SQL data (i.e. it is used for both an insert and an update)

# Types of Table

# (Simple) Table

Simple Tables (the default table type, defined by using the TableDef() class) are sinks for data. They are wrappers around
a concurrent map and are mechanisms to propagate update or delete events to join tables and view ports.

Currently simple tables are limited to having strings as the key. This is likely to change in future.

# Join Tables

Join tables represent the logical joining of two separate tables into a single merged table. In practice they are mappings of
keys from one table to keys from one or more other tables. When data is realized (i.e. sent down to a user's ui via the websocket)
the relevant rows are realized by dragging the data from the underlying simple tables.

# AutoSubscribe Table

Auto subscriber tables are simple data tables that when involved in a join will receive a special callback as part of the join process
to load data from a n external source by primary key.

An example of an auto subscribe table would be where we have an external source, such as market data, that we only want to subscribe to if we have any other data
like orders on particular symbols. When we join orders and prices, if the prices tables is defined as an auto subscribe table, we will make a call to the
autosubscribe table with the product symbol on the order once each time a new order is entered.

# Session Tables

Session tables are specific types of tables that live only during the users connected session to Vuu. There are several different types of session table:

### Tree Session Tables

Tree Session tables are created dynamically whenever there is a request to tree an underlying flat table. THe reason for this is that Tree's are a view on top of
and underlying raw table. When we create a tree, we are generating a tree data structure in memory whose leaves are keys that point back to the original rows
in the underlying table. When your session is closed, the server cleans up these tree tables, freeing up resources.

From a usage perspective you would typically not see these session tables, however its important o know they exist.

### Input Session Tables

Input Session tables are sinks for data where the data lives only within your session. They are defined in the same way as normal tables
however they are treated differently in that when a viewport is created for the session table, a new instance is created and registered with the
tableContainer.

```scala
//insert sample declaration, here
```

### Join Session Tables

Join Session tables are similar in concept to normal join tables, the only caveat is that like all session tables they only exist
for the lifetime of the session.

Join Session tables are useful when you want to have an input table, such as orders, but you want to show join table in the UI
beside the orders, such as ticking prices, or static data.

With a declaration like below, you can achieve that:

```scala
//insert example
```

# Lucene Table

TODO: Lucene tables are a work in progress, watch this space.
