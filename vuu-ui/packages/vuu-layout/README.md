# @vuu-ui/vuu-layout

> **Deprecated:** this package is deprecated and will be removed in a future release.
>
> If you are using `Flexbox` with `resizeable` children to create a pair of panes
> separated by a draggable splitter, use `SplitPane` from `@vuu-ui/vuu-ui-controls`
> instead. `SplitPane` follows the API of the Salt `FlexLayout` component, with Salt
> `FlexItem` components as children:
>
> ```tsx
> import { FlexItem } from "@salt-ds/core";
> import { SplitPane } from "@vuu-ui/vuu-ui-controls";
>
> <SplitPane direction="row" onSplitterMoved={([size1, size2]) => {}}>
>   <FlexItem basis="200px">Left</FlexItem>
>   <FlexItem grow={1}>Right</FlexItem>
> </SplitPane>;
> ```
