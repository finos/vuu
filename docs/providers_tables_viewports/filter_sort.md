# Filters and Sorts

Vuu supports either single or multifield sorting by ASC or DESC. 

Vuu also has an [ANTLR grammar](https://github.com/venuu-io/vuu/tree/master/vuu/src/main/antlr4/io/venuu/vuu/grammer) which allows filtering within viewports. 
Some exmples of what is supported in this grammar are:

```

ccy in [USD,GBP]

ric starts A

quantity > 1000 or quantity < 10

ric = TWTR and quantity > 10000
```

See more examples in the [Tests](https://github.com/venuu-io/vuu/blob/master/vuu/src/test/scala/io/venuu/vuu/core/filter/FilterGrammerTest.scala)



