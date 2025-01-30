# Vuu Layout

### LayoutProvider

#props

- `workspaceJSON`
  `LayoutProvider` manages layout state. It monitors layout changes across the managed layout component(s) and offers an API for persisting layout state and reconstituting a layout from persisted state.

The initial layout to be managed can be either state (layout metadata) or one or more nested child components. When a nested child layout component provides the initial layout, any changes to that layout will be monitored. If layout persistence is enabled, a subsequent refresh of the ui would recreate the layout from the saved metadata (ignoring nested child components). A layout can be created by passing appropriatly constructed layout metadata to the LayoutProvider, with no nested child components ever employed.

### example

If we create a `StackLayout` with four nested child components, we will see the Tabbed display we expect. If any of the child components have a `title` prop, we will see that title displayed on the corresponding Tab. If we select a different tab, the Tabstrip will not behave as we might expect - the clicked tab will not be selected and the tabbed content will be unchanged. That is because the `active` prop of a Stack is a `controlled` property. We are expected to manage the value of that property (provide `onTabSelectionChanged` prop and update state of `active`).

If we nest the `StackLayout` within a `LayoutProvider`, we will see different behaviour. Clicking tabs will change both the tab selection and the displayed content in the way that we would expect. That is because tab selection is classed as a `layout` event and that is exactly what the `LayoutProvider` helps usto manage.

### Scenario 1 - nested layout component

`LayoutProvider` expects `children` prop, the `children` will be rendered, but only after some enrichment. This enrichment takes place on initial render.

`children` to be rendered is a single layout container component. This component is stored internally as a RefObject `state`. This value is initialised on first render. If `children` is provided, `cloneElementAddLayoutProps` is called to enrich `children` component (or tree of components) with additional layout props. These props are

- id (if not already present)
- path
