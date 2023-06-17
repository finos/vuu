import { SvgDottySeparator } from "@site/src/components/SvgDottySeparator";

# Tree Builder

<SvgDottySeparator style={{marginBottom: 32}}/>

The Tree Builder is a component that sits on a separate thread, in a similar manner to the Filter and Sort functionality in the viewport container.
Its purpose is to, each cycle, produce a tree'd representation of an underlying table and to generate the tree-keys for the underlying
table keys.

The tree keys are injected into the viewport in the same way normal keys are injected into flat viewports.
