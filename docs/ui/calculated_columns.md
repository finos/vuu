import { SvgDottySeparator } from "@site/src/components/SvgDottySeparator";

# Calculated Columns

<SvgDottySeparator style={{marginBottom: 32}}/>

Implemented in issue [#345](https://github.com/venuu-io/vuu/issues/345)

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

### Requirements

Because there is a cost to calculating columns, the best style of implementation would involve parsing the expression
into some style of AST, and then evaluating that each time a row update was being realised by sending down the viewport.

This would also naturally throttle the quantity of updates.

The definition of this calculated column would have to be passed to the server in either the create viewport or change viewport
call in the JSON definition. It would need to be saved alongside the viewport JSON definition.

The calculated column would at minimum need to contain:

```json
{ "columnName": "", "calculation": "", "dataType": "" }
```

though datatype might be surplus or could be inferred.

**Question:** How would we infer datatype? How would we cater for nasty expressions like "= price _ clientName"? possible we could error. We could use
precedence in the datatypes, i.e. first column sets return value.? Or we could look for widest type in the event it was int _ double or int \* long.
It would likely be poor UX to ask the user to define the return type.

### Use in Tree'd Viewports

By default calculated columns would work the same in tree'd viewports as in non-tree'd viewports. THe only caveat to that
would be when the calculated column would be a branch in the tree. In that case the column values would have to be calculated in the
tree building function, which may slow down tree generation for specific viewports.

### Implementation

Calculated columns are defined as a column in the CreateViewPortRequest and the ChangeViewPortRequest. Whereas a normal request might only contain column names:

```json
//below is a vanilla example of a change vp message
VanillaExample: {"requestId":"1234","sessionId":"9097","token":"fe772f","user":"user","body":{"type":"CHANGE_VP","viewPortId":"user-d28fd","columns":["ask","askSize","bid","bidSize","close","last","open","phase","ric","scenario"],"sort":{"sortDefs":[]},"groupBy":["ric"],"filterSpec":null,"aggregations":[]},"module":"CORE"}
//then we have a calulated column example                                                                                                                                                                                                //calc'd columns
CalcColumnExample: {"requestId":"1234","sessionId":"9097","token":"fe772f","user":"user","body":{"type":"CHANGE_VP","viewPortId":"user-d28fd","columns":["ask","askSize","bid","bidSize","close","last","open","phase","ric","scenario", "askNotional:Long:=ask*askSize", "bidNotional:Long:=bid*bidSize"],"sort":{"sortDefs":[]},"groupBy":["ric"],"filterSpec":null,"aggregations":[]},"module":"CORE"}
```

You can see in the column description we have specified 3 fields separated by a colon, in the form: **fieldName:dataType:calculation**

When this instruction is received by the server it splits the field into its constituent parts and adds this specialized type of column to the ViewPortColumns object. Going forward only the fieldName will be returned when data is sent from the server.

### Supported Operators And Functions

Basic mathematical operators are implemented as you'd expect, some examples of this are:

All unquoted strings (such as bid, price, quantity etc below) are assumed to be column identifiers in the table and will be resolved.

```
        "=or(starts(orderId, \"NYC\"), min(120, quantity) > 122)",
        "=if(price > 100, \"true\", \"false\")",
        "=bid",
        "=200",
        "=bid+(price*quantity)",
        "=(price*quantity)*bid",
        "=price*quantity*bid",
        "=(i1-i2)-i3",
        "=(bid*ask)+(price-quantity)",
        "=(bid*100)+(price-50)",
        "=bid*100+price-50",
        "=bid*100.00+price-50.0*bid/price",
        "=price*quantity",
        "=(bid + ask) / 2",
        "=min(min(i1, i3), i2)",
        "=min(i1, i2)",
        "=text(i1, i2)",
        "=max(100, 200, 300)",
        "=concatenate(max(i1, i2), text(quantity))",s
```

In this case numeric data types returned from each clause are inferred by the widest field (i.e. boolean to int to long or double)

Inputs into functions can be:

- String or numeric, or boolean literals: "test1", 100, true, 100.01
- Field references from the table row: price
- Other functions: =if(search(customerName, "ABC"), true, false)

| Category | Function    | Example                                 | Result           | Return Type                                    | Notes                                                      |
| :------- | :---------- | :-------------------------------------- | ---------------- | ---------------------------------------------- | :--------------------------------------------------------- |
| Strings  | len         | =len("example")                         | 7                | Integer                                        | if used on non string field, toString will be called first |
|          | concatenate | =concatenate("example", "-test")        | "example-test"   | String - uppercase representation of field     |                                                            |
|          | upper       | =upper("example")                       | "EXAMPLE"        | String - uppercase representation of field     |                                                            |
|          | lower       | =lower("examPLE")                       | "example"        | String                                         |                                                            |
|          | left        | =left("example", 3)                     | "exa"            | String                                         |                                                            |
|          | right       | =right("example", 3)                    | "ple"            | String                                         |                                                            |
|          | replace     | =replace("exampleexample", "ex", "Foo") | FooampleFooample | String                                         |                                                            |
|          | text        | =text(12345)                            | "12345"          | String                                         |                                                            |
|          | contains    | =contains("example", "pl")              | true             | Boolean                                        |                                                            |
|          | starts      | =starts("example", "ex")                | true             | Boolean                                        |                                                            |
|          | ends        | =ends("example", "ple")                 | true             | Boolean                                        |                                                            |
| Math     | min         | =min(100, 101, 102, ...)                | 100              | Integer, Double                                |                                                            |
|          | max         | =max(100, 101, 102, ...)                | 102              | Integer, Double                                |                                                            |
|          | sum         | =sum(100, 101, 102)                     | 303              | Integer, Double                                |                                                            |
| Logic    | if          | =if( 100 > 102, "this", "that")         | "that            | variable, with the return of then else clauses |                                                            |
|          | or          | =or( 1=1, 1=2 )                         | True             | Boolean                                        |                                                            |
|          | and         | =and( 1=2, 1=2, 1=3)                    | False            | Boolean                                        |                                                            |

Functions Coming Soon...

| Category | Function | Example                      | Result | Return Type               | Notes                            |
| :------- | :------- | :--------------------------- | ------ | ------------------------- | :------------------------------- |
| Math     | round    | =round(101.01)               | 100    | Double                    | Equivalent to javas Math.round() |
|          | log10    | =log10(100)                  |        |                           | <<not implemented, coming soon>> |
|          | log      | =log(100)                    |        |                           | <<not implemented, coming soon>> |
|          | sqrt     | =sqrt(24)                    |        |                           | <<not implemented, coming soon>> |
|          | sin      | =sin(1.234)                  |        |                           | <<not implemented, coming soon>> |
|          | cos      | =cos(1.234)                  |        |                           | <<not implemented, coming soon>> |
|          | cosign   | =cosin(field1, field2, 1000) |        |                           | <<not implemented, coming soon>> |
| DateTime | day      | =day(time)                   |        | Long - millis since epoch | <<not implemented, coming soon>> |
|          | month    | =month(time)                 |        | Long - millis since epoch | <<not implemented, coming soon>> |
|          | year     | =year(time)                  |        | Long - millis since epoch | <<not implemented, coming soon>> |

### Null and Error Handling

In general a null combined with another numeric results in a null. A null used in a text function is assumed to be a zero length string, a null in a logic function is always false.

For numeric values 0 is assumed to be false, another other than 0 is assumed to be true (even decimals.)
