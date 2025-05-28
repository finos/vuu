import { Instruments } from "./Modules/SIMUL.examples";

export const DefaultColumnLayout = () => <Instruments />;

export const StaticColumnLayout = () => <Instruments columnLayout="static" />;

export const FitColumnLayout = () => <Instruments columnLayout="fit" />;
