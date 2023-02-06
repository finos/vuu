import {
  Component as PlaceHolder,
  DraggableLayout, Flexbox, Palette,
  PaletteItem, useViewContext, View
} from "@finos/vuu-layout";
import { Dropdown } from "@heswell/salt-lab";
import { useRef, useState } from "react";
import { atom, useRecoilValue, useSetRecoilState } from "recoil";

import "./layout-builder.css";

const layouts: any[] = [];

const availableLayouts = atom({
  key: "availableLayouts",
  default: [],
});

const LayoutPicker = ({ onCommit }) => {
  const availableValues = useRecoilValue(availableLayouts);
  return <Dropdown onSelect={onCommit} values={availableValues} />;
};

const StatefulComponent = (initialState = "", style: React.CSSProperties | undefined, stateKey: any) => {
  const { load, save } = useViewContext();
  const state = useRef(load(stateKey) ?? initialState);
  const [value, setValue] = useState(state.current);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue((state.current = e.target.value));
    save(state.current, stateKey);
  };
  return <textarea style={style} onChange={handleChange} value={value} />;
};


const BuilderPalette = ({ props }) => {
  return (
    <Palette {...props}>
      <PaletteItem header resizeable closeable title="Blue Monday">
        <StatefulComponent
          style={{ backgroundColor: "cornflowerblue", height: "100%" }}
        />
      </PaletteItem>
      <PaletteItem header resizeable closeable title="Brown Sugar">
        <StatefulComponent
          style={{ backgroundColor: "brown", height: "100%" }}
        />
      </PaletteItem>
      <PaletteItem header resizeable closeable title="Green Day">
        <StatefulComponent
          style={{ backgroundColor: "green", height: "100%" }}
        />
      </PaletteItem>
      <PaletteItem header resizeable closeable title="Lemonheads">
        <StatefulComponent
          style={{ backgroundColor: "yellow", height: "100%" }}
        />
      </PaletteItem>
      <PaletteItem header resizeable closeable title="Fade to Grey">
        <StatefulComponent
          style={{ backgroundColor: "#ddd", height: "100%" }}
        />
      </PaletteItem>
    </Palette>
  );
};

export const LayoutBuilder = () => {
  const [state, setState] = useState({
    layoutModel: undefined,
    managedLayoutNode: null,
    selectedLayoutNode: null,
    selectedId: null,
  });

  const setAvailableValues = useSetRecoilState(availableLayouts);

  const onLayoutModel = (layoutModel, id) => {
    layouts.push({ layoutModel, id });
    setAvailableValues((values) => values.concat(`${values.length}-Layout`));
  };

  const selectLayout = (item: string) => {
    const idx = parseInt(item);
    const { layoutModel, id } = layouts[idx];
    setState((state) => ({
      ...state,
      layoutModel: {
        ...layoutModel,
        id,
      },
    }));
  };

  return (
    <DraggableLayout onLayoutChange={onLayoutModel} layout={state.layoutModel}>
      <Flexbox
        className="LayoutBuilder"
        style={{ flexDirection: "column", width: 900, height: 600 }}
      >
        <Flexbox
          className="builder-top"
          style={{
            height: 60,
            backgroundColor: "rgb(90,90,90)",
            flexBasis: "auto",
            flexGrow: 0,
            flexShrink: 0,
          }}
        >
          <BuilderPalette style={{ flex: 1, backgroundColor: "inherit" }} />
          <div
            className="layout-edit-controls"
            style={{ backgroundColor: "red", width: 250 }}
          >
            <LayoutPicker onCommit={selectLayout} />
          </div>
        </Flexbox>
        <DraggableLayout
          style={{ flex: 1 }}
          dropTarget
        >
          <View resizeable style={{ flex: 1, width: "100%", height: "100%" }}>
            <PlaceHolder style={{ flex: 1, backgroundColor: "lightgrey" }} />
          </View>
        </DraggableLayout>
      </Flexbox>
    </DraggableLayout>
  );
};
