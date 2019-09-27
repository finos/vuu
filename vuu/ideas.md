##Ideas

###Indices

####Introduction

An index is basically a data structure which is updated on each tick of a dataset and
is subsequently used as a short cut to get rows when a filter is applied. 

There are a number of use cases where an index might be valuable:

1) Where you want to jump to a specific value `ric = "BT.L"` - this would allow you
to select all rows where the field is equal to your desired value without having to brute force all rows

2) Where you want to quickly iterate of unique values and jump to the union of those rows,
for example `ric starts B`. If you walk an index of the unique values of what the rics are you can quickly 
find the rows ids you want. 

3) where you want to apply a filter within bounds
for example `notionalUSD > 1,000,000 OR notionalUSD < 100`

The last one is probably the most complicated, because the data structure should allow you to find items
by clustering them together, i.e. find the first value that is > 1m and assume to can carry on till the end.

Value         | Rows           | 
 ------------ | :-----------: 
0             |                |
1             |     [1,2,3]    |
10            |     [4]        |
50            |     [5]        |
100           | [6]            |
200           | [7,8]          | 

If it were ordered it would be nice and rapid data structure to naviagte.

Another option would be to represent the field as a binary-tree in memory and traverse the tree when querying a range.


####Implementation:

A nice implementation might be to make the index a member of the data table itself. 
When an update comes through from the provider we could maintain a map of unique values to arrays of rows. 

Then when the filter loop tries to apply a filter criteria we could  build a query optimizer style component that
would check if the table has any relevent indices that could be used for a query, and if so use them. 
 


 

      


 



