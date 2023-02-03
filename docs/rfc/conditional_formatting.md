# Conditional Formatting

Tracked by issue [#223](https://github.com/venuu-io/vuu/issues/223)

### Introduction

Conditional formatting can be though of as two concepts, 1) a filter criteria: 
```
ric = VOD.L or notional > 1000
```
And a set of styling to be applied should that filter evaluate to true. 

For performance sake, the conditional formatting should be evaluated on the server side, at the time of realising a row
and sent down the websocket as additional data with the row. 

### What kind of styling can be applied?

Conditional formatting should allow the user to specify: 

1. Font, size, bold, strikethrough, italic
2. Fore (text) colour
3. Back colour
4. Border colour
5. Decay Flash (i.e. how we handle bid/offer updates)
6. Numeric formatting (decimal places, comma's etc..)

### How should we define styling on a viewport?

One way to implement the styling would be to generate a css class on the client (say "af9c") and then to define criteria where that style should be applied (ex. ric = FOO) and then
when that criteria evaluates to true, we would put the style back in the row update message to the client. 



**Questions:**

1. How would we transit the formatting information?

```json
{"type":"TABLE_ROW","batch":"36922aea-ad02-4eae-9a09-10f0a4bb1297","isLast":true,"timeStamp":1639654847947,"rows":[
{"viewPortId":"user-7d96f487-7cda-49e7-b92c-ba4915318528","vpSize":175760,"rowIndex":-1,"rowKey":"SIZE","updateType":"SIZE","ts":1639654847946,"sel":0,"data":[]},
{"viewPortId":"user-7d96f487-7cda-49e7-b92c-ba4915318528","vpSize":175760,"rowIndex":0,"rowKey":"AAA.L","updateType":"U","ts":1639654847947,"sel":0,"data":["AAA LN","USD","AAA.L London PLC","XLON/LSE-SETS","",633,"AAA.L"]},
{"viewPortId":"user-7d96f487-7cda-49e7-b92c-ba4915318528","vpSize":175760,"rowIndex":1,"rowKey":"AAA.N","updateType":"U","ts":1639654847947,"sel":0,"data":["AAA US","EUR","AAA.N Corporation","XNGS/NAS-GSM","",220,"AAA.N"]}
```

Probably the easiest implementation would be to add an optional rowFormat="" tag for row level formatting and an array of columnFormats=[] which would mirror the 
data tag. 

2. how would we represent the data for the formatting?

We could either use a style sheet style "font-family":, font-size: 10, colour: red
2
Or we could compress it, potentially giving each font a integer code "123:10:255:255:1", this would likely be faster to parse, but may limit how flexible we can be:
(example how would we add a new font to the integer lookup?) perhaps that might be a fair sacrifice for speed. 

3. Should this styling be available by default?
Probably yes, we may want to format cells a certain way in the UI, also that could differ based on the user's locale.
