# Drag and Drop

### DragDropProvider

The DragDropProvider is configured with `dragSources` and a `drop` handler. `dragSources` describe the components that support drag drop and the drag drop interop between them.
A `useEffect` hook is used to loop over the dragSources and initialize them for dragging at startup. This uses DOM methods to attach drag drop listeners. The cleanup phase of the `useEffect` removes all listeners. There are some conventions that must be followed for this to work correctly:

- Components that function as `drag containers` must include the CSS class `vuuDragContainer`.
- the draggable items must be direct children of the `drag container`
- the draggable items must include the CSS class `vuuDraggableItem`
- the draggable items must have the `draggable` HTML attribute
- the draggable items must have an appropriate `data-index` HTML attribute.

If the above conditions are satisfied, the `DragDropProvider` takes care of the rest. `DragDropProvider` creates a `DragContext` object to store the definitions of available drag sources/targets and also to manage the state of an in-progress Drag operation.

### drag-drop-listeners

This file defines the `initializeDragContainer` methiod, used by the `DragDropProvider` to initialize all drag sources. This is where the implementation of the key drag drop event handlers are found

- mousedown
- dragstart
- dragenter
- dragleave
- dragover
- drop
- dragend

All of these listeners execute within the scope of the `initializeDragContainer` function. This function receives as parameters not only the drag container element, but also the `DragContext` object created by the `DragDropProvider`. This object is updated throughout the course of a drag operation, providing a single source for drag drop state throughout the operation.

In addition to the `DragContext`, the drag drop methods also make use of an additional helper object - the `SpaceMan` (an abbreveated form of SpacerManager). The `SpaceMan` manages the low level details of a `natural movement` style of drag drop. In this pattern, the draggable items within a drag container slide aside as the dragged item is moved, always offering an empty space into which the dragged item will settle if dropped (and therefore indicating exactly where the dragged item will fall to rest, if dropped). Other patterns commonly to give feedback during drag drop used include a moving `DropIndicator`. THis pattern might be supported in future as an alternative to the sliding space approach.

### Lifecycle of a Drag Operation - DragDropProvider

1. `dragstart`

   `[drag-drop-listeners.ts, initializeDragContainer] onDragStart` =>
   `SpaceMan.dragStart`,
   `DragContext.beginDrag`

2. `dragEnter`

   `[drag-drop-listeners.ts, initializeDragContainer] onDragEnter`
   `SpaceMan.dragEnter`,

   determine mouse direction, invoke SpaceMan to manipulate spacer elements. SpaceMan behaviour depends on whether we were already within the drag container:

   - no - we are entering the drag container, there will be no spacers
   - yes, we are continuing an existing drag within this container

   In the first instance, we initialize the first spacer to displace the
   item below the mouse. State becomes ''spacer1. We may be reentering the drag container where drag was originally initiated, if f=dragged item was dragged out od the container. Alternatively, we may be dragging an item from elsewhere into this container. We need not care at this juncture (only when item is dropped)

   In the second instance, we will already have spacers, manipulate them as appropriate to displave the item now under the nouse.

3. `dragOver`

   `[drag-drop-listeners.ts, initializeDragContainer] onDragOver`

   simply calls preventDefault. This allows drop to fire. We don't care where mouse is - drop will not be handled unless it occurs over a drop target

4. `dragLeave`

   `[drag-drop-listeners.ts, initializeDragContainer] onDragLeave`
   `SpaceMan.leaveDragContainer`,

   calls leave dragContainer only IF drag has moved outside the drag container

5. `drop`

   `[drag-drop-listeners.ts, initializeDragContainer] onDrop` =>
   `SpaceMan.drop`,
   `DragContext.drop`

6. `dragend`

   `[drag-drop-listeners.ts, initializeDragContainer] onDragEnd` =>
   (`DragContext.dropped`)
   `SpaceMan.dragEnd`,

### GridLayoutProvider

The `GridLayoutProvider` is employed internally by a `GridLayout`. It is configured with the following

- dispatchGridLayoutAction
- layoutMap
- onDragStart
- onDrop

`GridLayoutProvider` provides a `GridLayoutProviderContext` object which stores the obove listen properties as well as one additional property

- onDragEnd

It provides helper hooks to access individual handlers/properties from the context object

- `useGridLayoutProviderDispatch`
- `useGridLayoutProps` provides access to layout definitions from the layoutsMap
- `useGridLayoutDropHandler`
- `useGridLayoutDragEndHandler`
- `useGridLayoutDragStartHandler`

### Lifecycle of a Drag Operation - GridLayoutProvider

1. `dragstart`

   `GridLayoutItem.useDraggable.handleDragStart` => `GridLayout.useGridSplitterResizing.handleDragStart`

   Draggable items are `GridLayoutItem` and `GridPalette`. Both use the `useDraggable` hook to define the HTML5 drag drop listeners. `useGridLayoutDragStartHandler` from the `GridLayoutProviderContext` provides a `dragstart` callback which is passed to this hook and invoked when drag operation is triggered. Drag is triggered from an element bearing the HTML `draggable` attribute. This will be the `GridLayoutItem.header` or the individual items within the `GridPalette`. The `useDraggable` hook provides `dragstart` and `dragend` handlers only. See `useAsDropTarget` for other drag drop lifecycle handlers.
   `dragstart` populates the `dataTransfer` payload and invokes `GridLayoutProvider.onDragStart`.
   `dragend` simply invokes the `GridLayoutProvider.onDragEnd`. This is NOT CURRENTLY USED

`GridLayout` creates the `GridLayoutProvider` and provides the `onDragStart`. This comes from the `useGridSplitterResizing` hook. `useGridSplitterResizing.onDragStart` does two things

- adds the CSS class `vuuDragging` to the grid container
- calls `removeGridItem` to remove the dragged item from its current grid layout position.

IT does NOT remove the GridItem from the DOM. The CSS class `vuuGridLayoutItem-dragging` is added to dragged item which moves it to a zero size grid position 1/1. It removes this item from the Grid layout model (`GridLayoutModel.removeGridItem`). `Splitters` and `Placeholders` are recomputed and remaining grid layout items will fill the space previously occupied by the dragged item.

2. `dragenter`

`GridLayoutItem.useAsDropTarget.onDragEnter`

`GridLayoutItem` will implement drop oriented drag drop handlers. It will try and determine the current drop target, using the `data-drop-target` HTML attribute. Once determined it will store the box co-ordinates of the drop target (including tabstrip co-ordinates if we have a `StackedGridLayoutItem`) for later use by `dragover` handler.

3. `dragover`

`GridLayoutItem.useAsDropTarget.onDragOver`

here we manage the display of current drop target indicator - we show a translucent overlay to indicate the current drop position. If draggable is released, drop target indicator shows the position into which the dropped item will settle. If dragging over a `TabsList` no indicator will be displayed and management of the drag operation will be delegated to the Tabs specific drag drop handling

4. `dragleave`

`GridLayoutItem.useAsDropTarget.onDragLeave`

here we clear the droptarget state that was created on `onDragEnter` and remove any CSS classes added for the drop indicator.

5. `drop`

`GridLayoutItem.useAsDropTarget.onDrop` => `GridLayout.useGridSplitterResizing.handleDrop`

here we cleanup any remaining drag related classnames, extract the `dataTransfer` payload details and invoke the drop handler provided (via context hook `useGridLayoutDropHandler`) by `GridLayout`.
`handleDrop` is where the final layout model manipulation happens to reposition the dragged item in the location at which it has been dropped.

6. `dragend`
