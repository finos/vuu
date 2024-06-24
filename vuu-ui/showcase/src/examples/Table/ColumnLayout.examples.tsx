import { SimulTable } from "./SIMUL.examples";

let displaySequence = 1;

export const DefaultColumnLayout = () => <SimulTable />;
DefaultColumnLayout.displaySequence = displaySequence++;

export const StaticColumnLayout = () => <SimulTable columnLayout="static" />;
StaticColumnLayout.displaySequence = displaySequence++;

export const FitColumnLayout = () => <SimulTable columnLayout="fit" />;
FitColumnLayout.displaySequence = displaySequence++;
