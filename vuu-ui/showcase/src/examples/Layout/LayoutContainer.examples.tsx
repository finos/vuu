import cx from "clsx";
import { CSSProperties, HTMLAttributes, SyntheticEvent } from "react";

import {
  Component,
  LayoutContainer,
  FlexboxLayout as Flexbox,
  LayoutProvider,
  Palette,
  PaletteItem,
  StackLayout,
  useViewContext,
  View,
} from "@vuu-ui/vuu-layout";

import { Brown, StatefulComponent } from "./components";

import "./LayoutContainer.examples.css";

const Box = (props: HTMLAttributes<HTMLDivElement>) => (
  <div
    style={{
      cursor: "pointer",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    {...props}
  />
);

export interface DraggableBoxProps extends HTMLAttributes<HTMLDivElement> {
  flexFill?: boolean;
  size?: string;
}

const DraggableBox = ({
  className,
  flexFill,
  size = "small",
  ...props
}: DraggableBoxProps) => {
  const DraggableBoxBase = () => {
    const { dispatch, title } = useViewContext();
    const handleMouseDown = (e: SyntheticEvent) => {
      // TODO should be able to just dispatch the event
      dispatch?.({ type: "mousedown" }, e);
    };
    return <Box onMouseDown={handleMouseDown}>{title}</Box>;
  };

  return (
    <View
      className={cx("DraggableBox", className, size, {
        "flex-fill": flexFill,
      })}
      {...props}
    >
      <DraggableBoxBase />
    </View>
  );
};

export const EmptyDraggable = () => {
  return (
    <LayoutContainer
      style={{ width: 600, height: 400, border: "solid 1px #ccc" }}
    />
  );
};

export const SimpleNesting = () => {
  const handleLayoutChange = () => {
    console.log(`handleLayoutChange`);
  };
  return (
    <LayoutProvider onLayoutChange={handleLayoutChange}>
      <LayoutContainer dropTarget style={{ width: 800, height: 500 }}>
        <Flexbox
          id="top-cat"
          style={{ width: "100%", height: "100%", flexDirection: "row" }}
          path=""
        >
          <View
            header
            closeable
            resizeable
            title="Test 1"
            style={{ flexBasis: 250, flexGrow: 0, flexShrink: 0 }}
          >
            <div style={{ backgroundColor: "yellow", height: "100%" }}>
              <input defaultValue="just a test 1" />
              <input defaultValue="just a test 2" />
            </div>
          </View>
          <Flexbox
            id="the-one"
            style={{ flex: 1, flexDirection: "column" }}
            resizeable
            path=""
          >
            <Flexbox
              id="flexbox-1"
              style={{
                flex: 2,
                flexGrow: 1,
                flexShrink: 1,
                flexDirection: "row",
              }}
              resizeable
              path=""
            >
              <View header resizeable title="Test 2" style={{ flex: 1 }}>
                <Component
                  style={{ height: "100%", backgroundColor: "orange" }}
                />
              </View>
              <View header resizeable title="Test 4" style={{ flex: 1 }}>
                <Component
                  style={{ height: "100%", backgroundColor: "rebeccapurple" }}
                />
              </View>
            </Flexbox>
            <View header id="bar" resizeable title="Test 5" style={{ flex: 1 }}>
              <StatefulComponent
                style={{ height: "100%", backgroundColor: "#94bff5" }}
              />
            </View>
            <View header id="foo" resizeable title="Test 6" style={{ flex: 1 }}>
              <StatefulComponent
                initialState="I'm a Tree"
                style={{ height: "100%", backgroundColor: "pink" }}
              />
            </View>
          </Flexbox>
        </Flexbox>
      </LayoutContainer>
    </LayoutProvider>
  );
};

export const ImplicitSizing = () => (
  <LayoutContainer style={{ width: "100vw", height: "100vh" }}>
    <Flexbox
      style={{ width: "100%", height: "100%", flexDirection: "column" }}
      resizeable
      path=""
    >
      <div
        data-placeholder
        data-resizeable
        style={{ flexBasis: 472, flexGrow: 1, flexShrink: 1 }}
      />
      <Flexbox
        style={{
          flexBasis: 250,
          flexGrow: 0,
          flexShrink: 0,
          flexDirection: "row",
        }}
        resizeable
        path=""
      >
        <div
          data-placeholder
          data-resizeable
          style={{ flexBasis: 347, flexGrow: 1, flexShrink: 1 }}
        />
        <View
          header
          closeable
          resizeable
          title="Test 2"
          style={{ height: 250, width: 300 }}
        >
          <Component style={{ height: "100%", backgroundColor: "orange" }} />
        </View>
        <div
          data-placeholder
          data-resizeable
          style={{ flexBasis: 347, flexGrow: 1, flexShrink: 1 }}
        />
      </Flexbox>
      <div
        data-placeholder
        data-resizeable
        style={{ flexBasis: 472, flexGrow: 1, flexShrink: 1 }}
      />
    </Flexbox>
  </LayoutContainer>
);

export const SimpleNestingWithOffset = () => {
  const handleLayoutChange = () => {
    console.log(`handleLayoutChange`);
  };

  return (
    <LayoutProvider onLayoutChange={handleLayoutChange}>
      <LayoutContainer
        dropTarget
        style={{ marginLeft: 100, marginTop: 50, width: 800, height: 500 }}
      >
        <Flexbox
          style={{ width: "100%", height: "100%", flexDirection: "row" }}
          path=""
        >
          <View header resizeable title="Test 1" style={{ width: 250 }}>
            <div style={{ backgroundColor: "yellow", height: "100%" }}>
              <input defaultValue="just a test 1" />
              <input defaultValue="just a test 2" />
            </div>
          </View>
          <Flexbox
            style={{ flex: 1, flexDirection: "column" }}
            resizeable
            path=""
          >
            <Flexbox
              style={{
                flex: 2,
                flexGrow: 1,
                flexShrink: 1,
                flexDirection: "row",
              }}
              resizeable
              path=""
            >
              <View header resizeable title="Test 2" style={{ flex: 1 }}>
                <Component
                  style={{ height: "100%", backgroundColor: "orange" }}
                />
              </View>
              <View header resizeable title="Test 4" style={{ flex: 1 }}>
                <Component
                  style={{ height: "100%", backgroundColor: "rebeccapurple" }}
                />
              </View>
            </Flexbox>
            <View header id="bar" resizeable title="Test 5" style={{ flex: 1 }}>
              <StatefulComponent
                style={{ height: "100%", backgroundColor: "#94bff5" }}
              />
            </View>
            <View header id="foo" resizeable title="Test 6" style={{ flex: 1 }}>
              <StatefulComponent
                initialState="I'm a Tree"
                style={{ height: "100%", backgroundColor: "pink" }}
              />
            </View>
          </Flexbox>
        </Flexbox>
      </LayoutContainer>
    </LayoutProvider>
  );
};

export const MultipleDraggableContainers = () => (
  <LayoutProvider>
    <LayoutContainer style={{ width: 800, height: 800 }}>
      <Flexbox
        style={{ width: "100%", height: "100%", flexDirection: "row" }}
        path=""
      >
        <LayoutContainer style={{ flex: 1 }} dropTarget>
          <Flexbox
            style={{ width: "100%", height: "100%", flexDirection: "column" }}
            resizeable
            path=""
          >
            <Flexbox
              style={{
                flex: 2,
                flexGrow: 1,
                flexShrink: 1,
                flexDirection: "row",
              }}
              resizeable
              path=""
            >
              <View header resizeable title="Test 2a" style={{ flex: 1 }}>
                <Component
                  style={{ height: "100%", backgroundColor: "orange" }}
                />
              </View>
              <View header resizeable title="Test 4a" style={{ flex: 1 }}>
                <Component
                  style={{ height: "100%", backgroundColor: "rebeccapurple" }}
                />
              </View>
            </Flexbox>
            <View header resizeable title="Test 5" style={{ flex: 1 }}>
              <StatefulComponent
                style={{ height: "100%", backgroundColor: "#94bff5" }}
              />
            </View>
            <View header resizeable title="Test 6" style={{ flex: 1 }}>
              <StatefulComponent
                initialState="I'm a Tree"
                style={{ height: "100%", backgroundColor: "pink" }}
              />
            </View>
          </Flexbox>
        </LayoutContainer>
        <LayoutContainer style={{ flex: 1 }} dropTarget>
          <Flexbox
            style={{ width: "100%", height: "100%", flexDirection: "column" }}
            resizeable
            path=""
          >
            <Flexbox
              style={{
                flex: 2,
                flexGrow: 1,
                flexShrink: 1,
                flexDirection: "row",
              }}
              resizeable
              path=""
            >
              <View header resizeable title="Test 2b" style={{ flex: 1 }}>
                <Component
                  style={{ height: "100%", backgroundColor: "orange" }}
                />
              </View>
              <View header resizeable title="Test 4b" style={{ flex: 1 }}>
                <Component
                  style={{ height: "100%", backgroundColor: "rebeccapurple" }}
                />
              </View>
            </Flexbox>
            <View header resizeable title="Test 5" style={{ flex: 1 }}>
              <StatefulComponent
                style={{ height: "100%", backgroundColor: "#94bff5" }}
              />
            </View>
            <View header resizeable title="Test 6" style={{ flex: 1 }}>
              <StatefulComponent
                initialState="I'm a Tree"
                style={{ height: "100%", backgroundColor: "pink" }}
              />
            </View>
          </Flexbox>
        </LayoutContainer>
      </Flexbox>
    </LayoutContainer>
  </LayoutProvider>
);

export const CustomDrag = () => (
  <LayoutProvider>
    <LayoutContainer
      className="custom1"
      dropTarget
      style={{ border: "solid 1px grey", width: 500, height: 600 }}
    >
      <Flexbox
        splitterSize={1}
        column
        className="red-box"
        path=""
        style={{ height: "100%", width: "100%" }}
      >
        <Flexbox gap={5} row className="green-box" path="">
          <DraggableBox flexFill title="B Component" />
          <DraggableBox flexFill title="B Component" />
          <DraggableBox flexFill title="B Component" />
        </Flexbox>
        <Flexbox row flexFill path="">
          <Flexbox column className="red-box" gap={10} path="">
            <DraggableBox size="intrinsic" />
            <DraggableBox size="intrinsic" />
            <DraggableBox size="intrinsic" />
            <DraggableBox size="intrinsic" />
            <DraggableBox flexFill />
          </Flexbox>
          <Flexbox
            column
            flexFill
            className="blue-box"
            gap={6}
            style={{ padding: 6 }}
            path=""
          >
            <DraggableBox flexFill />
            <DraggableBox flexFill />
            <DraggableBox flexFill />
          </Flexbox>
        </Flexbox>
      </Flexbox>
    </LayoutContainer>
  </LayoutProvider>
);

export const ComplexNestedLayout = () => {
  const handleLayoutChange = () => {
    console.log(`handleLayoutChange`);
  };

  const viewProps = {
    closeable: true,
    resizeable: true,
    header: true,
  };

  return (
    <LayoutProvider onLayoutChange={handleLayoutChange}>
      <LayoutContainer style={{ height: "100vh", width: "100vw" }}>
        <Flexbox column style={{ height: "100%", width: "100%" }} path="">
          <Flexbox style={{ flex: 1 }} path="">
            <View
              closeable
              header
              resizeable
              style={{
                minWidth: 50,
                width: 200,
                flexGrow: 0,
                flexBasis: "auto",
              }}
              title="Palette"
            >
              <Palette
                orientation="vertical"
                style={{ width: "100%", height: "100%" }}
                title="View Palette"
              >
                <PaletteItem
                  component={
                    <Component
                      style={{
                        backgroundColor: "cornflowerblue",
                        height: "100%",
                      }}
                    />
                  }
                  value="Blue Monday"
                  ViewProps={viewProps}
                ></PaletteItem>
                <PaletteItem
                  component={
                    <Component
                      style={{ backgroundColor: "brown", height: "100%" }}
                    />
                  }
                  value="Brown Sugar"
                  ViewProps={viewProps}
                ></PaletteItem>
                <PaletteItem
                  component={
                    <Component
                      style={{ backgroundColor: "green", height: "100%" }}
                    />
                  }
                  value="Green Day"
                  ViewProps={viewProps}
                ></PaletteItem>
                <PaletteItem
                  component={
                    <Component
                      style={{ backgroundColor: "yellow", height: "100%" }}
                    />
                  }
                  value="Lemonheads"
                  ViewProps={viewProps}
                ></PaletteItem>
              </Palette>
            </View>
            <LayoutContainer
              dropTarget
              style={{ flex: 1, "--vuuView-margin": "0px" } as CSSProperties}
            >
              <Flexbox
                resizeable
                column
                style={{ width: "100%", height: "100%" }}
                path=""
              >
                <View
                  closeable
                  header
                  resizeable
                  style={{ flex: 1 }}
                  title="Brown Bear"
                >
                  <Brown />
                </View>
                <View
                  closeable
                  header
                  resizeable
                  style={{ flex: 1 }}
                  title="Red Panda"
                >
                  <Component
                    style={{ backgroundColor: "red", height: "100%" }}
                  />
                </View>

                <Flexbox resizeable style={{ flex: 1 }} path="">
                  <StackLayout
                    TabstripProps={{
                      allowAddTab: true,
                    }}
                    style={{ flex: 1 }}
                    keyBoardActivation="manual"
                  >
                    <View closeable header resizeable title="Home">
                      <Component
                        style={{ backgroundColor: "white", height: "100%" }}
                      />
                    </View>
                    <View title="Transactions">
                      <Component
                        style={{ backgroundColor: "yellow", flex: 1 }}
                      />
                    </View>
                    <View closeable header resizeable title="Loans">
                      <Component
                        style={{ backgroundColor: "cream", height: "100%" }}
                      />
                    </View>
                    <View closeable header resizeable title="Checks">
                      <Component
                        style={{ backgroundColor: "ivory", height: "100%" }}
                      />
                    </View>
                    <View closeable header resizeable title="Liquidity">
                      <Component
                        style={{ backgroundColor: "lightgrey", height: "100%" }}
                      />
                    </View>
                  </StackLayout>
                  <Component
                    resizeable
                    style={{
                      backgroundColor: "green",
                      width: 50,
                      flexBasis: "auto",
                      flexGrow: 0,
                    }}
                  />
                </Flexbox>
              </Flexbox>
            </LayoutContainer>
          </Flexbox>
          <Component
            style={{
              backgroundColor: "grey",
              height: 32,
              flexBasis: "auto",
              flexGrow: 0,
            }}
          />
        </Flexbox>
      </LayoutContainer>
    </LayoutProvider>
  );
};

export const ScrollingLayout = () => (
  <LayoutContainer>
    <Flexbox
      style={{ width: "100vw", height: "100vh", flexDirection: "column" }}
      path=""
    >
      <View
        header
        title="Test 1"
        style={{ height: 100, flexBasis: "auto", flexGrow: 0, flexShrink: 0 }}
      >
        <div style={{ backgroundColor: "yellow", height: "100%" }}>
          <input defaultValue="just a test 1" />
          <input defaultValue="just a test 2" />
        </div>
      </View>
      <Flexbox
        style={{ flex: 1, flexDirection: "column", overflow: "auto" }}
        resizeable
        path=""
      >
        <Flexbox
          style={{
            height: 1000,
            flexGrow: 0,
            flexShrink: 0,
            flexDirection: "row",
          }}
          resizeable
          path=""
        >
          <Flexbox style={{ flex: 1, flexDirection: "column" }} path="">
            <View header resizeable title="Test 2a" style={{ flex: 1 }}>
              <Component
                style={{ height: "100%", backgroundColor: "orange" }}
              />
            </View>
            <View header resizeable title="Test 2b" style={{ flex: 1 }}>
              <Component style={{ height: "100%", backgroundColor: "cyan" }} />
            </View>
          </Flexbox>
          <View header resizeable title="Test 4" style={{ flex: 1 }}>
            <Component
              style={{ height: "100%", backgroundColor: "rebeccapurple" }}
            />
          </View>
        </Flexbox>
        <View
          header
          resizeable
          title="Test 5"
          style={{ height: 300, flexShrink: 0, flexGrow: 0 }}
        >
          <Component style={{ height: "100%", backgroundColor: "blue" }} />
        </View>
        <View
          header
          resizeable
          title="Test 6"
          style={{ flex: 1, minHeight: 100 }}
        >
          <Component style={{ height: "100%", backgroundColor: "pink" }} />
        </View>
      </Flexbox>
      <View style={{ height: 100 }}>
        <Component style={{ height: "100%", backgroundColor: "grey" }} />
      </View>
    </Flexbox>
  </LayoutContainer>
);

export const JsonLayout = () => {
  return (
    <LayoutProvider
      workspaceJSON={{
        type: "Flexbox",
        props: {
          active: 0,
          style: {
            width: "100%",
            height: "100%",
            flexBasis: 0,
            flexGrow: 1,
            flexShrink: 1,
            flexDirection: "row",
          },
          resizeable: true,
        },
        children: [
          {
            type: "View",
            props: {
              header: true,
              resizeable: true,
              closeable: true,
              title: "Blue Monday",
              style: {
                flexBasis: 0,
                flexGrow: 1,
                flexShrink: 1,
                width: "auto",
                height: "auto",
              },
            },
            children: [
              {
                type: "StatefulComponent",
                props: {
                  style: { backgroundColor: "cornflowerblue", height: "100%" },
                },
              },
            ],
          },
          {
            type: "View",
            props: {
              header: true,
              resizeable: true,
              closeable: true,
              title: "Brown Sugar",
              style: {
                width: "auto",
                height: "auto",
                flexBasis: 0,
                flexGrow: 1,
                flexShrink: 1,
              },
            },
            children: [
              {
                type: "StatefulComponent",
                props: { style: { backgroundColor: "brown", height: "100%" } },
              },
            ],
          },
        ],
      }}
    >
      <LayoutContainer dropTarget style={{ width: 600, height: 400 }} />
    </LayoutProvider>
  );
};
