import React from "react";

import { FluidGrid } from "@vuu-ui/vuu-layout";

const RED = "rgba(255,0,0,.4)";
const ORANGE = "rgba(255,165,0,.7)";
const VIOLET = "rgba(238,130,238,.7)";

const story = {
  title: "Layout/FluidGrid",
  component: FluidGrid,
};

export default story;

// const StandardToolbar = () => (
//   <Toolbar style={{ justifyContent: "flex-end" }} draggable showTitle>
//   </Toolbar>
// );
// registerComponent("StandardToolbar", StandardToolbar);

export const ResponsiveDefault = () => (
  <FluidGrid
    responsive
    spacing={3}
    showGrid
    style={{
      minHeight: 800,
      flexDirection: "row",
      border: "2px solid black",
      margin: 20,
      backgroundColor: "#ccc",
    }}
  >
    <div data-xs={12} style={{ backgroundColor: RED }} />
    <div data-xs={12} data-sm={6} style={{ backgroundColor: ORANGE }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: VIOLET }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: VIOLET }} />
    <div data-xs={12} data-sm={9} style={{ backgroundColor: "yellow" }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: "green" }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: "blue" }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: "indigo" }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: VIOLET }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: VIOLET }} />
  </FluidGrid>
);

const breakPoints = { xs: 0, sm: 600, md: 960, lg: 1280 };

export const WithBreakPoints = () => (
  <FluidGrid
    breakPoints={breakPoints}
    responsive
    spacing={3}
    className="layout-grid"
    style={{
      height: 500,
      flexDirection: "row",
      border: "2px solid black",
      margin: 20,
      backgroundColor: "#ccc",
    }}
  >
    <div data-xs={12} style={{ backgroundColor: "rgba(255,0,0,.8)" }} />
    <div data-xs={12} data-sm={6} style={{ backgroundColor: "#FFA500DD" }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: "violet" }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: "violet" }} />
    <div data-xs={12} data-sm={9} style={{ backgroundColor: "yellow" }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: "green" }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: "blue" }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: "indigo" }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: "violet" }} />
    <div data-xs={12} data-sm={3} style={{ backgroundColor: "violet" }} />
  </FluidGrid>
);

export const ResponsiveStructure = () => (
  <FluidGrid
    cols={12}
    showGrid
    spacing={3}
    style={{
      flexDirection: "row",
      margin: 20,
      minHeight: 300,
      backgroundColor: "#ccc",
    }}
  >
    <div data-xs={12} style={{ height: 32 }} />
    <div data-xs={4} style={{ minHeight: 300 }} />
    <FluidGrid
      data-xs={8}
      cols={8}
      style={{ backgroundColor: "rgba(0,0,255,.3)", minHeight: 300 }}
      showGrid
    >
      <div
        data-xs={8}
        data-sm={4}
        style={{ backgroundColor: "green", minHeight: 50 }}
      />
    </FluidGrid>
    <div data-xs={12} style={{ height: 32 }} />
    {/* 
    <FluidGrid data-xs={12} cols={12} style={{}}>
      <FluidGrid data-xs={8}  cols={8} style={{minHeight: 300}}>
        <div data-xs={8} style={{ backgroundColor: "rgba(0,0,255,.3)", minHeight: 50 }} />
        <FluidGrid data-xs={8} cols={8} style={{}}>
          <div data-xs={4} style={{ backgroundColor: "green", minHeight: 50 }} />
          <div data-xs={4} style={{ backgroundColor: "blue" }} />
        </FluidGrid>
        <FluidGrid data-xs={8} cols={8} style={{}}>
          <div data-xs={4} style={{ backgroundColor: "green", minHeight: 50 }} />
          <div data-xs={4} style={{ backgroundColor: "blue" }} />
        </FluidGrid>
        <FluidGrid data-xs={8} cols={8} style={{}}>
          <div data-xs={4} style={{ backgroundColor: "green", minHeight: 50 }} />
          <div data-xs={4} style={{ backgroundColor: "blue" }} />
        </FluidGrid>
      </FluidGrid>
    </FluidGrid> 
    */}
  </FluidGrid>
);
