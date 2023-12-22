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
  // prettier-ignore
  return (
    <GridLayout colCount={3} id="GridLayoutC" rowCount={2}>
      <div className="component" id="component-C1" data-text="C1"/>
      <div className="component" id="component-cyan" tabIndex={0}/>
      <div className="component" id="component-green" data-resizeable="v"/>
      <div className="component" id="component-brown" data-resizeable="v" />
      <div className="component" id="component-black" data-resizeable="v"/>
      <div className="component" id="component-yellow" data-resizeable="v"/>
    </GridLayout>
  );
};
GridLayoutC.displaySequence = displaySequence++;

export const GridLayoutD = () => {
  // prettier-ignore
  return (
    <GridLayout colCount={2} id="GridLayoutD" rowCount={2}>
      <div className="component" data-color="green" id="green-D" data-resizeable="hv"/>
      <div className="component" data-color="brown" id="brown-D" data-resizeable="hv" />
      <div className="component" data-color="black" id="black-D" data-resizeable="hv"/>
      <div className="component" data-color="yellow" id="yellow-D" data-resizeable="hv"/>
    </GridLayout>
  );
};
GridLayoutD.displaySequence = displaySequence++;
