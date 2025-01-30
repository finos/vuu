# Grid Layout

### Overview

`GridLayout` is a container component that manages the positioning of all nested child components. It renders a `div` element and that element is assigned the CSS `position` property '`grid`'. The layout capabilities of `GridLayout` extend beyond a static definition of child component placement. `GridLayout` supports runtime re-arrangement of child components - both programatically and via user interaction. Child components can be added to and/or removed from a layout. Components can be resized and moved to different positions within a layout. A layout can be persisted and re-loaded from a stored state. To provide this functionality, `GridLayout` employs a suite of supporting components/services. These will be described in more detail later, but can be summarised as follows:

- `GridModel`
- GridLayout hook - `useGridLayout`: manages the grid model and child elements of the grid layout. Hosts services that operate on these.
- `GridLayoutContext`: makes the gridModel and GridLayout hook services available to nested components.
- drag and drop services
  - `DragDropProvider`
  - `useDraggable`
  - `useAsDropTarget`
  - `drag-drop-listeners`: drag drop implementation for Salt Tabs

The direct child components of `GridLayout` are instances of `GridLayoutChildItem` (plus two more specialised types described further below). In `JSX` components nested directly within a `GridLayout` which are not wrapped with `GridLayoutChildItem` will be wrapped at render time.

### GridLayout

`GridLayout` renders the div that acts as the CSS grid container. It renders the child elements whose positioning is based on grid co-ordinates. It also renders `PlaceHolder` elements on areas of the grid not occupied by child components. It also rensers `Splitter` elememnts where appropriate so resizeable child elements can be resized by user.
State management and runtime manipulation/loading/saving of the layout is delegated to two hooks.

- useGridLayout
- useGridSplitterResizing

### GridLayoutContext

### GridModel

When a layout has been loaded from persistent state, the `GridModel` is constructed from that state. When loading a `GridModel` directly from a `JSX` declaration, each GridLayoutItem registers itself with the `GridModel` on first render, so the full `GridModel` is built progressively as the `GridLayout` and all child items render. Any subsequent user interactions that effect changes in the layout are first applied to the `GridModel` which trigger changes to be applied to the associated `React` components.

### GridLayoutItem

### GridLayoutStackedItem

### GridLayoutProvider

### useGridLayout

This hook manages a number of state properties

- children, the child elements of `GridLayout`.
- gridModel, a state object of type `GridModel` that represents the structure of the grid. That means primarily the number of rows and columns and the row/column co-ordinates of all child elements.

### Lifecycle

`GridLayout`

call `useGridLayout` to get `children`. These are the child elements of `GridLayout`. The child elements can be UI components of any type. Each will be rendered within a wrapper component, `GridLayoutItem`, which acts as an intermediary between the child element and the `GridLayout`.

The collection of one or more `GridLayoutItem` + child element can be defined in a number of ways, starting with JSX declarations:

1. User may nest child elements directly inside JSX tags of `GridLayout`

```jsx
<GridLayout>
  <div>Component 1</div>
  <div>Component 2</div>
</GridLayout>
```

When user defines GridLayout content like this, `GridLayoutItem` wrappers are added by `GridLayout` during render.

2. User may explicitly nest child elements within `GridLayoutItem` elements within `GridLayout`. This example omits some required props, these will be covered fully below.

```jsx
<GridLayout>
  <GridLayoutItem>
    <div>Component 1</div>
  </GridLayoutItem>
  <GridLayoutItem>
    <div>Component 2</div>
  </GridLayoutItem>
</GridLayout>
```

However defined, the children are passed to `useGridLayout`, where the definitive set of child elements to be rendered are prepared once (by means of `useMemo`) and saved as react state. WHen a GridLayout is mounted, `useGridLayout` retrieves saved child elements, together with savedLayout from the GridLayoutProvider hook `useSavedGrid`. If no GridLayoutProvider is present, or no `save` has previously been performed, these will be undefined. If saved elements are present, these will be rendered, NOT the children derived from nested JSX elements. There is a check to determine whether child elements are instances of `GridLayoutItem`. If not, they will be wrapped with `GridLayoutItem` elements. The child elements saved in state are returned from `useGridLayout` and rendered. Operations which add, remove or update children will reset state and trigger rendering. This will also cause the `onChangeChildElements` callback to be invoked. This is provided via the `GridLayoutProvider` and the mechanism by which layout changes are persisted. The implementation of this callback prop is in `GridLayoutProvider` which stores the current child elements for each managed `GridLayout` after first serializing them to `LayoutJSON`. By this mechanism, layouts which are mounted, updated than unmounted (e.g because rendered within a tabbed container and selected tab changes) can subsequently be re-created when re mounted. THat happens when the saved elements are requested at mount time as described above. THis meachanism also allows persistence of layouts across sessions, if `LayoutJSON` is saved to a persistent store.
