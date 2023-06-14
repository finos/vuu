# Core Concepts

* [Lifecycle](lifecycle.md) manages the startup sequence of the server.
* [Providers](providers.md) take data from a source, such as the network, and inject them into data tables. 
* [Tables](tables.md) contain data, subset of which is displayed in viewports.
* [Viewports](viewports.md) manage the per-user display state, identifying the relevant subset of data from a table, and applying server side transformations such as filtering, sorting or treeing.
* [Filter and Sort](filter_sort.md) are per-viewport transformation of the data, applied on the server side. See also [Trees](../trees).
* [Modules](modules.md) are reusable pieces of configuration, that can create tables, providers and RPC calls. 

