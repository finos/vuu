import { SimulTable } from "./SIMUL.examples";

export const DefaultColumnLayout = () => <SimulTable />;

export const StaticColumnLayout = () => <SimulTable columnLayout="static" />;

export const FitColumnLayout = () => <SimulTable columnLayout="fit" />;
