let displaySequence = 1;

import { GridLayout } from "./components/GridLayout";
import "./GridLayout.examples.css";

export const GridLayoutA = () => {
  return (
    <GridLayout colCount={24} id="GridLayoutA" rowCount={13}>
      <div className="component" id="component-A1" />
      <div className="component" id="component-A2" />
      <div className="component" id="component-A3" />
      <div className="component" id="component-A4" />
      <div className="component" id="component-A5" />
    </GridLayout>
  );
};
GridLayoutA.displaySequence = displaySequence++;

export const GridLayoutB = () => {
  return (
    <GridLayout colCount={1} id="GridLayoutB" rowCount={3}>
      <div className="component" id="component-B1" />
      <div className="component" id="component-B2" tabIndex={0} />
      <div className="component" id="component-B3" data-resizeable="v" />
      <div className="component" id="component-B4" data-resizeable="v" />
      <div className="component" id="component-B5" data-resizeable="v" />
    </GridLayout>
  );
};
GridLayoutB.displaySequence = displaySequence++;

export const GridLayoutC = () => {
  return (
    <GridLayout colCount={3} id="GridLayoutC" rowCount={2}>
      <div className="component" id="component-C1" />
      <div className="component" id="component-C2" tabIndex={0} />
      <div className="component" id="component-C3" data-resizeable="v" />
      <div className="component" id="component-C4" data-resizeable="v" />
      <div className="component" id="component-C5" data-resizeable="v" />
    </GridLayout>
  );
};
GridLayoutC.displaySequence = displaySequence++;
