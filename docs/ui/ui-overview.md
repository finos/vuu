import { SvgDottySeparator } from "@site/src/components/SvgDottySeparator";

# Vuu UI Introduction

<SvgDottySeparator style={{marginBottom: 32}}/>

The purpose of the Vuu server is to serve data efficiently to UI clients. The Vuu project provides a number of client side libraries to
make building such UI clients easier. These are published as NPM packages. There are no real constraints on exactly how the UI is built. The libraries provided by Vuu
target the Web platform and the descriptions in this section will be limited to Web based applications.

# How does the application UI consume Vuu data ?

First thing to understand is the basic pattern that defines the Vuu client-server architecture. A single Vuu server instance will serve data to many UI clients. Each of those UI clients will connect to one and only one Vuu server instance. That connection is made over a WebSocket, which allows for efficient two-way communication between client and server. Components are the building blocks of modern UI applications. A single application will generally be composed of many smaller, specialised components. Some of these components will render data from the Vuu server. In the context of a Trading System , an obvious example of such a component would be a Trading Blotter - which is a DataGrid.

The data table is the foundational unit of data storage within the Vuu server, just as the component is the building block of the UI. The expectation is that tables within the Vuu server will be designed to match the needs of the UI and the ideal scenario would be that a single UI component consumes and renders data from a single Vuu table. The `vuu-data` library package provides everything necesary to connect a UI application to a Vuu server and to allow individual UI components to subscribe to data from data tables on that server. To continue the example above, the Trading Blotter will subscribe to a Vuu data table, maybe an Orders table or a Prices table, or a composite table that joins the two. The ability to join tables on the server makes it possible to tailor data tables to the needs of the UI, without unnecessary duplication of data on the server.

Full details of how to use the `vuu-data` package here: [The Vuu Data package](vuu_data.md)

# What Vuu UI packages are available and what do they do ?

[The Vuu Data Table package](vuu_data_table.md)

If an application uses the Vuu server, must the UI be built with Vuu UI components ?

Does Vuu work with Ag Grid ?

[The Vuu Data Ag Grid package](vuu_data_ag_grid.md)

How do I run the Vuu Sample App ?

What Features does Vuu offer for UI development beyond loading data ?

How do I get started with Vuu as a UI developer ?
