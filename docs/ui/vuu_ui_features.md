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

## How does a Vuu app know which Feature(s) to load ?

## Getting started - how do I create a Feature ?

## Does the Vuu Showcase support Features ?

Yes it does. The Vuu showcase is a developer tool that allows components to be rendered in isolation, with hot module reloading for a convenient developer experience. Features are a little more complex to render here because of the injection of props by the Vuu Shell
and the fact that many features will create Vuu datasources. When running in the Showcase, we might want to use local datasources with no requirement to have a Vuu server instance running. All of this can be achieved and existing Showcase examples demonstrate how this is done.

### dataSource creation/injection in Showcase features

Most features will create Vuu dataSource(s) internally. However there is a pattern for dataSource creation, descibed above. Features should use the session state service provided by the Vuu shell to manage any dataSources created. The Showcase can take advantage of this pattern by pre-populating the session store with dataSources. The Feature, when loaded will then use these dataSources rather than creating.
In the existing Showcase examples, there is a `features` folder. The components in here are wrappers round actual VuuFeatures implemented in sample-apps. These render the actual underlying feature but only after creating local versions of the dataSource(s) required by those features and storing them in session state. WHen these features are rendered in SHowcase examples, they will be using the local test data.
