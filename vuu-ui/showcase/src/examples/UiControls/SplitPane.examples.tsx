import { FlexItem } from "@salt-ds/core";
import {
  SplitPane,
  SplitPaneProps,
  SplitterMovedHandler,
} from "@vuu-ui/vuu-ui-controls";
import { CSSProperties, useCallback, useState } from "react";

const paneStyle = (background: string): CSSProperties => ({
  alignItems: "center",
  background,
  display: "flex",
  justifyContent: "center",
});

const SplitPaneTemplate = ({
  direction = "row",
  onSplitterMoved,
  style = { height: 400, width: 600 },
  ...props
}: Partial<SplitPaneProps>) => {
  const [sizes, setSizes] = useState("");
  const handleSplitterMoved = useCallback<SplitterMovedHandler>(
    (sizes) => {
      setSizes(sizes.map((size) => Math.round(size)).join(","));
      onSplitterMoved?.(sizes);
    },
    [onSplitterMoved],
  );
  return (
    <>
      <SplitPane
        {...props}
        data-testid="split-pane"
        direction={direction}
        onSplitterMoved={handleSplitterMoved}
        style={{ border: "solid 1px lightgray", ...style }}
      >
        <FlexItem basis="200px" data-testid="pane-1" style={paneStyle("ivory")}>
          Pane 1
        </FlexItem>
        <FlexItem
          data-testid="pane-2"
          grow={1}
          style={paneStyle("aliceblue")}
        >
          Pane 2
        </FlexItem>
      </SplitPane>
      <input data-testid="sizes" readOnly value={sizes} />
    </>
  );
};

export const DefaultSplitPane = () => <SplitPaneTemplate />;

export const ColumnSplitPane = () => <SplitPaneTemplate direction="column" />;

export const SplitPaneWithGap = () => (
  <SplitPaneTemplate gap={1} padding={1} splitterSize={5} />
);

export const SplitPaneMinMaxSizes = () => (
  <SplitPane
    data-testid="split-pane"
    style={{ border: "solid 1px lightgray", height: 400, width: 600 }}
  >
    <FlexItem
      basis="200px"
      data-testid="pane-1"
      style={{ ...paneStyle("ivory"), minWidth: 100, maxWidth: 400 }}
    >
      min 100, max 400
    </FlexItem>
    <FlexItem
      data-testid="pane-2"
      grow={1}
      style={{ ...paneStyle("aliceblue"), minWidth: 150 }}
    >
      min 150
    </FlexItem>
  </SplitPane>
);

export const NestedSplitPanes = () => (
  <SplitPane style={{ height: 600, width: 800 }}>
    <FlexItem basis="200px" style={paneStyle("ivory")}>
      Navigation
    </FlexItem>
    <FlexItem grow={1} style={{ display: "flex" }}>
      <SplitPane direction="column" style={{ flex: 1 }}>
        <FlexItem grow={1} style={paneStyle("aliceblue")}>
          Main
        </FlexItem>
        <FlexItem basis="150px" style={paneStyle("honeydew")}>
          Details
        </FlexItem>
      </SplitPane>
    </FlexItem>
  </SplitPane>
);

export const SplitPaneSingleChild = () => {
  const [showSecondPane, setShowSecondPane] = useState(true);
  return (
    <>
      <button onClick={() => setShowSecondPane((show) => !show)}>
        Toggle second pane
      </button>
      <SplitPane style={{ height: 400, width: 600 }}>
        <FlexItem basis="200px" grow={1} style={paneStyle("ivory")}>
          Pane 1
        </FlexItem>
        {showSecondPane ? (
          <FlexItem grow={1} style={paneStyle("aliceblue")}>
            Pane 2
          </FlexItem>
        ) : null}
      </SplitPane>
    </>
  );
};
