# Trees

Trees are a specialized views onto tables that live within specific users viewports. Trees are built on a separate thread
in a very similar manner to sorts and filters, but instead of creating a flat array of keys the output of the tree builder
is a tree where the leaf nodes are the keys. 

When a viewport is changed to be tree'd the keys in the viewport are changed to be Tree Keys. 
Also additional information is added to the table to denote whether a branch node is open or closed,
and how deep the specific tree key is indented in the structure. 

Tree's are represented in a specific type of table TreeSessionTable, which unlike other tree's lives within a users viewport
and is a derivation on an underlying table. When the viewport is closed the TreeTable is deleted. 

```
//Pre Tree'd Viewport:

Keys = [
    "order-001"
    "order-002"
    "order-003"
    "order-004"
]
```
```
//Post Tree'd Viewport keys, after we have tree'd by RIC
Keys = [
    "$root/AAPL"             //branch, isOpen = true, indent = 1
    "$root/AAPL/order-001"
    "$root/AAPL/order-002"
    "$root/GOOG"             //branch, isOpen = true , indent = 1
    "$root/GOOG/order-003"
    "$root/GOOG/order-004"
]
```





