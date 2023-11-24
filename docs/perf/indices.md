# Indices

Indices are a mechanism for filter a tables keys quickly. They are defined as part of a table  and under the hood they are implemented as skip lists. 
Currently, there is no query planner for indices, as a more advanced SQL database might have. They simply will shortcut the filtering process if an index exists on a field. 

Adding indices to a field dramatically reduces the cost of filter on that field, at the memory expense of maintaining an extra data structure and slight processing overhead.  

Below is a table that has an index defined on the ric field. 

```scala

    TableDef(
          name = "parentOrders",
          keyField = "id",
          Columns.fromNames("id:String", "idAsInt: Int", "ric:String", "childCount: Int", "price:Double", "quantity:Int", "side:String", "account:String", "exchange: String",
                                    "ccy: String", "algo: String", "volLimit:Double", "filledQty:Int", "openQty:Int", "averagePrice: Double", "status:String",
                                    "lastUpdate:Long"),
          VisualLinks(
            Link("ric", "prices", "ric")
          ),
          //index
          indices = Indices(
            Index("ric")
          ),
          joinFields = "id", "ric"
        ),
        (table, vs) => new ParentOrdersProvider(table, ordersModel)
      )


```