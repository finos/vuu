# Calculated Columns - RFC

Tracked by issue [#224](https://github.com/venuu-io/vuu/issues/224)

### Introduction

Calculated columns are a way for a user to enhance an existing viewport by adding columns dynamically and saving the definition of these columns with the viewport definition. 

Examples of when you might want to use calculated columns are: 

1. Creating a mathematical operation between existing columns 
```
//if I wanted to create a column that is notional value of a row in USD, I could define it terms of the existing columns.
notionalInUsd "=price * quantity * fxToUSD"
```
2. A logical operation to identify data for filtering:

```
//if I wanted to have a custom field called "key clints" I might define it as
keyClients "=clientName in [FOO, BAR]"
returning true/false
```

### Implementation

Because there is a cost to calculating columns, the best style of implementation would involve parsing the expression 
into some style of AST, and then evaluating that each time a row update was being realised by sending down the viewport. 

This would also naturally throttle the quantity of updates.

The definition of this calcualted column would have to be passed to the server in either the create viewport or change viewport 
call in the JSON definition. It would need to be saved alomgside the viewport JSON definition.

The calculated column would at minimum need to contain: 
```json
{ "columnName":"", "calculation":"", "dataType":""}
```
though datatype might be surplus or could be inferred.

**Question:** How would we infer datatype? How would we cater for nasty expressions like "= price * clientName"? possible we could error. We could use 
precendence in the datatypes, i.e. first column sets return value.? Or we could look for widest type in the event it was int * double or int * long. 
It would likely be porr UX to ask the user to define the return type. 

### Use in Tree'd Viewports

By default calculated columns would work the same in tree'd viewports as in non-tree'd viewports. THe only caveat to that 
would be when the calculated column would be a branch in the tree. In that case the column values would have to be calcuated in the
tree building function, which may slow down tree generation for specific viewports. 





