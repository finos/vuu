# How Features currently work in Vuu

# Vuu Application = Vuu Shell + Feature(s)

A Vuu ui is an instance of the Vuu Shell, which loads content dynamically at runtime. The Shell renders the outermost chrome of the application:

- the App Header
- the left nav
- the Context panel
- a container for the main content

The shell creates the WebWorker from which all communication with the server will be handled. It provides the layout system, a persistence service and other application level features. COmponents implementing the business functionality of a Vuu application will be loaded dymanically (by the Shell) and rendered within the main content area.

Feature is the term used in Vuu to describe a UI component that can be loaded into the application to provide some specific functionality. This can be as simple as a single data table that displays data from a remote Vuu server. Equally, it can be a complex component with multiple tabbed pages that orchestrates data from multiple Vuu data tables. The Feature might occupy the full content area of the app, or it may be one of multiple features assembled within a `layout`. These are decisions that can be enforced by the application developer or made available to the end user.

## Loading Features at runtime

Technically, a feature is an ES module with a default export which must be a React component. The module will be loaded at runtime, using standard ES module loading. In other words, the module is known to the application by a url, which will be used to load it via a dynamic import statement.

The component that actually implements the dynamic loading is `Feature`, which can be found in the `vuu-shell` package.

Here are props expected/supported by `Feature`

```TypeScript
export interface FeatureProps<P extends object | undefined = any> {
  ComponentProps?: P;
  css?: string;
  height?: number;
  title?: string;
  url: string;
  width?: number;
}
```

The only required prop is `url`. That is the url for the JavaScript bundle that exports the featured component. Most features will also ship a css bundle. By default, features will be rendered within the Vuu UI with a header. This will dsplay the feature `title`, if provided. `ComponentProps` will be passed to the component actually rendered (i.e. the component exported by the feature bundle), so these should appropriate to that component. Vuu provide a mechanism for features to persist state between sessions. This can include props, which will be injected back into a loaded feature at construction time.

## How are Feature bundles built - current state

Right now, both the bundle exporting the Vuu Shell and all feature bundles are built together in a single build task. ESBuild is used for this and the code splitting features of ESBuild determine the exact breakdown of code into multiple bundles. The main application will output a bundle. Each feature is defined as an entrypoint to the build, so each feature will also output a bundle. These are the feature bundles that will be loaded dynamically. Any number of additional bundles may be created as dependencies, as ESBuild identifies opportunities for code sharing across bundles.

## How will Feature bundles be built - future state

It is not ideal that all bundles must be created, together with the runtime shell, in a single build. If one feature gets an update, the entire app must be rebuilt and redeployed to make this update available. Vuu is going to move to a more dynamic module system, whereby feature bundles can be built and published independently. The challenge here is managing shared depedencies. The current plan is to use Vite based `Module Federation` to achieve this. It is a system designed for exactly this scenario. This will be implemented alongside a runtime discovery mechanism, so that newly published or republished feature bundles can be indentified and surfaced in a running application.

## What is a Vuu `View` and what is the relationship between a `View` and a `Feature`

## How does a Feature manage data communication with the Vuu Server ?

Data from a remote Vuu server instance is managed using one or more client side DataSource instances. A single DataSource represents a subscription to a Vuu table. A Feature may need to create more than one dataSource. The basket trading feature is an example of a complex feature that creates five dataSources. The Filter Table feature creates a single dataSource. There is a pattern for dataSource management that all features should use and that can be seen in all the existing Features provided with the sample app. Once created, a dataSource should be saved using the session storage mechanism provided by Vuu. When loading, a Feature should first try to load dataSources from session state. If not found, they can be instantiated then saved into session state. THe reason for this is that there are some runtime scenarios that will result in a React component being unmounted, then remounted. When this happens, we want to try and avoid tearing down then recreating the server subscription(s). By storing the dataSource(s) in session state , they persist across React component remount events and can be reloaded back into the original owning component. In the future, as the Feature API is evolved, we will look at baking this behaviour into `feature datasources`. Note: if users do not do this and build Features that always create new dataSource instances whenever mounted, they will work as expected, if less efficient in terms of server resources.

## How does a Vuu app know which Feature(s) to load ?

The sample app provided with Vuu does not load any features by default. It initially renders only the Shell. It does provide a mechanism to allow a user to add features to the app at runtime - from the palettes available in the Left Nav. The `Vuu Features` palette offers the Basket Trading and Instrument Tiles features. The `Vuu Tables` palette hosts the Filter Table feature, which can be dragged onto the main content area of the app, using any one of the listed Vuu tables.
In a real world application, the app would just as likely be built with one or more features built-in and preloaded by default.

## Getting started - how do I create a Feature ?

TBC

## Does the Vuu Showcase support Features ?

Yes it does. The Vuu showcase is a developer tool that allows components to be rendered in isolation, with hot module reloading for a convenient developer experience. Features are a little more complex to render here because of the injection of props by the Vuu Shell
and the fact that many features will create Vuu datasources. When running in the Showcase, we might want to use local datasources with no requirement to have a Vuu server instance running. All of this can be achieved and existing Showcase examples demonstrate how this is done.

### dataSource creation/injection in Showcase features

Most features will create Vuu dataSource(s) internally. However there is a pattern for dataSource creation, described above, which helps us here. Features should use the session state service provided by the Vuu shell to manage any dataSources created. The Showcase can take advantage of this pattern by pre-populating the session store with one or more dataSources. The Feature, when loaded will then use these dataSources rather than creating new dataSource instances.
In the existing Showcase examples, there is a `features` folder. The components in here are wrappers round actual VuuFeatures implemented in `sample-apps`. These render the actual underlying feature but only after creating local versions of the dataSource(s) required by those features and storing them in session state. When these features are rendered in Showcase examples, they will be using the local test data.

Within the `examples` folder of Showcase, the `VuuFeatures` folder has examples of usage of the BasketTrading, InstrumentTiles and FilterTable features.
Each of these has at least two exported examples. One exports the example feature directly, using it as a regular React component. The other exports the example using the actual `Feature` dynamic loader component, which loads the feature from a url. This mimics almost exactly the way features are loaded into a Vuu app. The actual urls employed will vary depending on whether the Showcase is being run in dev mode (with hot module reloading) or with a built version of Showcase. Both sets of urls can be seen in the examples and the set approprtate to the current environment will be used. The Showcase build is set up to define bundle examples as separate entry points so feature bundles are created.
