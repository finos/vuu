import React, { useRef, useState } from "react";
import { atom, useSetRecoilState, useRecoilValue } from "recoil";
import {
  Flexbox,
  Component as PlaceHolder,
  DraggableLayout,
  Palette,
  PaletteItem,
  registerComponent,
  View,
  useViewContext,
} from "@vuu-ui/vuu-layout";
import { Dropdown } from "@heswell/uitk-lab";

// import LayoutConfigurator from '../layout-configurator';
// import {  LayoutTreeViewer } from '../layout-tree-viewer';

import "./layout-builder.css";

const layouts = [];

const availableLayouts = atom({
  key: "availableLayouts", // unique ID (with respect to other atoms/selectors)
  default: [],
});

const LayoutPicker = ({ onCommit }) => {
  const availableValues = useRecoilValue(availableLayouts);
  return <Dropdown onSelect={onCommit} values={availableValues} />;
};

const StatefulComponent = ({ initialState = "", style, stateKey }) => {
  const { load, save } = useViewContext();
  const state = useRef(load(stateKey) ?? initialState);
  const [value, setValue] = useState(state.current);
  const handleChange = (e) => {
    setValue((state.current = e.target.value));
    save(state.current, stateKey);
  };
  return <textarea style={style} onChange={handleChange} value={value} />;
};

registerComponent("StatefulComponent", StatefulComponent);

const BuilderPalette = (props) => {
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

export const LayoutBuilder = ({ enableSave, width = 800, height = 1000 }) => {
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
    // console.log(`%c${JSON.stringify(layoutModel, null, 2)}`, 'color:blue;font-weight: bold;');
    //     setState(prevState => ({
    //         ...prevState,
    //         managedLayoutNode: layoutModel
    //     }));
  };

  // // TODO look at layout configurator
  // const handleChange = (feature, dimension, value, layoutStyle) => {
  // }

  // const selectComponent = selectedLayoutNode => {
  //   console.log(`select node ${selectedLayoutNode.$path} ${selectedLayoutNode.$id}`)
  //   setState({
  //     ...state,
  //     selectedLayoutNode
  //   })
  // }

  const selectLayout = (item) => {
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

  // const selectLayout = id => setState({
  //   ...state,
  //   selectedId: id
  // })

  // const layoutStyle = state.selectedLayoutNode === null
  // ? NO_STYLES
  // : state.selectedLayoutNode.style;

  // const selectedIdx = availableValues.indexOf(state.selectedId)

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
          // selectedNode={state.selectedLayoutNode ? {
          //   $id: state.selectedLayoutNode.$id,
          //   $path: state.selectedLayoutNode.$path
          // }: null}
        >
          <View resizeable style={{ flex: 1, width: "100%", height: "100%" }}>
            <PlaceHolder style={{ flex: 1, backgroundColor: "lightgrey" }} />
          </View>
        </DraggableLayout>
      </Flexbox>
    </DraggableLayout>
  );
};

// function layoutSerializer(key, value){
//   if (key === 'computedStyle' || key === 'layoutStyle' || key === 'visualStyle' || key === '$path'){
//     return;
//   }
//   if (key === 'children' && value !== undefined && value.length === 1 && value[0].type === 'layout'){
//     return undefined;
//   }

//   if (key === 'children' && this.type === 'FlexBox'){
//     return value.filter(child => child.type !== 'Splitter');
//   }

//   return value;
// }

/*
         {<Flexbox style={{flexDirection: 'row', height: 400}}>
           {<LayoutTreeViewer
             style={{width: '50%'}}
             tree={state.managedLayoutNode}
             onSelectNode={selectComponent}/>}
           <LayoutConfigurator
             style={{width: '50%'}}
             layoutStyle={layoutStyle}
             onChange={handleChange}/>
         </Flexbox> }

*/
