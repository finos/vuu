import cx from "classnames";
import {
  Accordion,
  AccordionDetails,
  AccordionSection,
  AccordionSummary,
} from "@heswell/uitk-lab";
import { Palette, PaletteItem } from "@finos/vuu-layout";
import { Feature } from "@finos/vuu-shell";
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
} from "@heswell/uitk-lab";

import { useMemo, useState } from "react";
import { TableSchema, VuuTableSchemas } from "@finos/vuu-data";

//prettier-ignore
const tables = [
  { table: "childOrders", module: "SIMUL" },
  {table: "instrumentPrices", module: "SIMUL" },
  {table: "instruments", module: "SIMUL" },
  {table: "metricsGroupBy", module: "METRICS" },
  {table: "metricsTables", module: "METRICS" },
  {table: "metricsViewports", module: "METRICS" },
  {table: "orderEntry", module: "SIMUL" },
  {table: "orderEntryPrices", module: "SIMUL" },
  {table: "orders", module: "SIMUL" },
  {table: "ordersPrices", module: "SIMUL" },
  {table: "parentOrders", module: "SIMUL" },
  {table: "prices",  module: "SIMUL" },
  {table: "uiState", module: "vui" },
];

// const getPaletteItems = (config) => {
//   const paletteItems = [];

//   config.forEach((configItem) => {
//     const { label, items = [] } = configItem;
//     paletteItems.push(
//       <div key={label} data-header>
//         {label}
//       </div>
//     );
//     items.forEach((paletteItem, i) => {
//       const { component, type, props, ...args } = paletteItem;
//       if (component) {
//         paletteItems.push(
//           <PaletteItem {...args} key={i}>
//             {component}
//           </PaletteItem>
//         );
//       } else if (type && isRegistered(type)) {
//         const Component = ComponentRegistry[type];
//         paletteItems.push(
//           <PaletteItem {...args} key={i}>
//             {React.createElement(Component, {
//               ...props,
//               key: i,
//             })}
//           </PaletteItem>
//         );
//       }
//     });
//   });

//   return paletteItems;
// };
export interface AppSidePanelProps {
  tables: VuuTableSchemas;
}

const gridFeatures = [
  {
    className: "vuuFilteredGrid",
    css: "./features/filtered-grid/index.css",
    js: "./features/filtered-grid/index.js",
  },
  {
    className: "vuuAgGridFeature",
    css: "./features/ag-grid/index.css",
    js: "./features/ag-grid/index.js",
  },
];

const byModule = (schema1: TableSchema, schema2: TableSchema) => {
  const m1 = schema1.table.module.toLowerCase();
  const m2 = schema2.table.module.toLowerCase();
  if (m1 < m2) {
    return -1;
  } else if (m1 > m2) {
    return 1;
  } else if (schema1.table.table < schema2.table.table) {
    return -1;
  } else if (schema1.table.table > schema2.table.table) {
    return 1;
  } else {
    return 0;
  }
};

const capitalize = (text: string) =>
  text.length === 0 ? "" : text[0].toUpperCase() + text.slice(1);

const regexp_worfify = /(?<!(^|[A-Z]))(?=[A-Z])|(?<!^)(?=[A-Z][a-z])/;
const wordify = (text: string) => {
  const [firstWord, ...rest] = text.split(regexp_worfify);
  return `${capitalize(firstWord)} ${rest.join(" ")}`;
};

export const AppSidePanel = ({ tables }: AppSidePanelProps) => {
  const classBase = "vuuAppSidePanel";

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const handleChange: ToggleButtonGroupChangeEventHandler = (
    event,
    index,
    toggled
  ) => {
    console.log(`onChange [${index}] toggled ${toggled}`);
    setSelectedIndex(index);
  };

  const paletteItems = useMemo(() => {
    return Object.values(tables)
      .sort(byModule)
      .map((schema) => {
        const { className, css, js } = gridFeatures[selectedIndex];
        return {
          component: (
            <Feature
              css={css}
              params={{
                className,
                schema,
                style: { height: "100%" },
              }}
              url={js}
            />
          ),
          id: schema.table.table,
          label: `${schema.table.module} ${wordify(schema.table.table)}`,
        };
      });
  }, [selectedIndex, tables]);

  return (
    <div className={cx(classBase)}>
      <Accordion defaultExpandedSectionIds={["tables"]}>
        <AccordionSection id="layouts" key={"layouts"}>
          <AccordionSummary>My Layouts</AccordionSummary>
          <AccordionDetails></AccordionDetails>
        </AccordionSection>
        <AccordionSection key={"rivers-and-lakes"} id="tables">
          <AccordionSummary>Vuu Tables</AccordionSummary>
          <AccordionDetails>
            <ToggleButtonGroup
              onChange={handleChange}
              selectedIndex={selectedIndex}
            >
              <ToggleButton ariaLabel="alert" tooltipText="Alert">
                Vuu Grid
              </ToggleButton>
              <ToggleButton ariaLabel="home" tooltipText="Home">
                Ag Grid
              </ToggleButton>
            </ToggleButtonGroup>

            <Palette
              orientation="vertical"
              style={{ width: "100%", height: "100%" }}
            >
              {paletteItems.map((spec) => (
                <PaletteItem
                  closeable
                  key={spec.id}
                  label={spec.label}
                  resizeable
                  resize="defer"
                  header
                >
                  {spec.component}
                </PaletteItem>
              ))}
            </Palette>
          </AccordionDetails>
        </AccordionSection>
        <AccordionSection id="templates" key={"islands"}>
          <AccordionSummary>Layout Templates</AccordionSummary>
          <AccordionDetails></AccordionDetails>
        </AccordionSection>
      </Accordion>
    </div>
  );
};
