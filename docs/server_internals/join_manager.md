# Join Manager

The Join Manager receives row updates from underlying tables, and propagates the join rows as necessary to view ports. 

As an example, say we had the tables: 

```
Product (simple table)
---------
Id
Description
Currency

and 

Order (simple table)
----------
Id
Quantity
ProductId
UserName

OrderDetail (join table)
----------
OrderId
ProductId
Quanity
UserName
Currency
```

The relationship is one to many for products to orders (i.e. many orders can be executed on a single product.)

When we get an update through for a product, id = 1, what we want to do is check our data structure internally to see which orders
have a foreignKey productId = 1, say we find 3, then we want to propagate an event for each orderdetail row to the viewport for those rows. 

This mapping between tables and the multiplication of the event based on join logic is what the join manager does.  

 



