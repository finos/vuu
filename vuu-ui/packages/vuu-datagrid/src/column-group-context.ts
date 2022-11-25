import React from "react";
import { ColumnGroupType } from "./grid-model";
const columnGroupContext = React.createContext<ColumnGroupType | null>(null);
export default columnGroupContext;
