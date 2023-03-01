# Filters and Sorts

Vuu supports either single or multifield sorting by ASC or DESC. 

Vuu also has an [ANTLR grammar](https://github.com/finos/vuu/tree/main/vuu/src/main/antlr4/org/finos/vuu/grammar) which allows filtering within viewports. 
Some examples of what is supported in this grammar are:

```

ccy in [USD,GBP]

ric starts A

quantity > 1000 or quantity < 10

ric = TWTR and quantity > 10000
```

See more examples in the [Tests](https://github.com/finos/vuu/blob/main/vuu/src/test/scala/org/finos/vuu/core/filter/FilterGrammarTest.scala)



