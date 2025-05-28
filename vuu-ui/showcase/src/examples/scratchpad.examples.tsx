import { useMemo } from "react";

type TableDef = {
  name: string;
};

class TableDefImpl implements TableDef {
  constructor(public name: string) {}
}

function TableDef(name: string): TableDef {
  return new TableDefImpl(name);
}

export const Experiment = () => {
  const tableDef = useMemo(
    () => TableDef("instrument"),

    [],
  );

  return <div>{tableDef.name}</div>;
};
