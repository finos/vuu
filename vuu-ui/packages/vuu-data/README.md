# vuu-data

This package allows a web application to consume data from a [VUU](https://https://vuu.finos.org/docs/introduction/intro/) server instance.

## RPC calls

There are two flavours of RPC call, 'direct' RPC calls and 'menu' RPC calls.

This package supports both, direct RPC calls are made via the ConnectionManager - the useRpcService hook can be used from a React component. Menu RPC calls always pertain to a specific viewport and are made via the DataSource.

Currently there are two direct Rpc requests, both provided by the TypeAhead service (TypeAheadRpcHandler)

- getUniqueFieldValues
- getUniqueFieldValuesStartingWith

There is one menu Rpc request, provided by the Order Entry service (OrderEntryRpcHandler)

- addRowsFromInstruments
