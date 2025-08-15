# Features

1. Build list of feature descriptors and make available throughout the app via context
2. LeftNav consumes features and builds `Palette`
3. User drags `PaletteItem` and drops onto layout.

Features are defined in JSON configuration and introduced into an app vie the `FeatureAndLayoutProvider`

This accepts 3 categories of `feature` or `layout`

- Dynamic features
- Static features
- System layouts

## Dynamic Features

Dynamic feature configuration is described by the type `DynamicFeatureDescriptor`

```typescript
export interface DynamicFeatureDescriptor {
  css?: string;
  featureProps?: {
    vuuTables?: "*" | VuuTable[];
  };
  leftNavLocation: "vuu-features" | "vuu-tables";
  name: string;
  title: string;
  url: string;
  viewProps?: ViewConfig;
}
```

example with two features. In the sample app, these are passed to the app via config.json, which is created in the build script. Config for features is defined in the feature package.json.

```json
[
  {
    title: "Vuu Filter Table",
    name: "filter-table",
    ...featurePaths.FilterTableFeature,
    featureProps: {
      vuuTables: "*",
    },
    leftNavLocation: "vuu-tables",
  },
  {
    title: "Basket Trading",
    name: "basket-trading",
    ...featurePaths.BasketTrading,
    viewProps: {
      header: false,
    },
    leftNavLocation: "vuu-features",
  },
]
```

The `FeatureAndLayoutProvider` splits thes into `dynamic` features and `table` features, based on the leftNavLocation.
The `table` feature is expanded into a feature entry for each table available in the tableList provided by Vuu server.
ViewProps are added to the DynamicFeatureDescriptor for each table, setting `allowRename` to true and emitted as `DynamicFeatureProps`
a `title` is added, based on table and module name in schema. The schema itself as added as `ComponentProps` - these are the props passed to TableFeature.

These features are made available to consumers via the `FeatureContext`.

## LeftNav

The LeftNav consumes `table` and `dynamic` features from `FeatureContext`.
tableFeatures are sorted by module and table name, then grouped into module groups.

Now table feature `DynamicFeatureProps` look like this example

```typescript
  {
    title: "SIMUL Instruments",
    name: "filter-table",
    url: '/path/to/bundle',
    leftNavLocation: "vuu-tables",
    ComponentProps: {
        tableSchema: TableSchema;
    },
    ViewProps: {
        allowRename: true
    }
  },

```

Finally, the `LeftNav` creayes individual `FeatureList` instances for `dynamic` features and `table` features.
a `LayoutList` is created for saved layouts.

## FeatureList

DeatureList creates a `Palette` for each group of features and a `PaletteItem` for each feature.

The ``PaletteItem` is configures here with `ViewProps` attributes that will determine some of the runtime characteristics of a component instance created from a `PaletteItem` - these will be passed as props to the `View` that wraps the target component.

- closeable
- resizeable
- header
- resize='defer`

The most important prop passed to `PaletteItem` is the component - this is `Feature` whose props are the `DynamicFeatureProps` illustrated above. Note: `title` becomes `value` as `PaletteItem` is a List `Option` and requires this prop.

## Users drags a PaletteItem
