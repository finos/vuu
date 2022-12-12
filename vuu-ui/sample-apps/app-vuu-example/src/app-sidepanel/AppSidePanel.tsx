import { Palette, PaletteItem } from "@vuu-ui/vuu-layout";
import { Feature, Features } from "@vuu-ui/vuu-shell";
import {
  Accordion,
  AccordionDetails,
  AccordionSection,
  AccordionSummary,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
} from "@heswell/uitk-lab";
import cx from "classnames";

import { TableSchema, VuuTableSchemas } from "@vuu-ui/vuu-data";
import React, { ReactElement, useMemo, useState } from "react";

const NO_FEATURES: Features = {};
export interface AppSidePanelProps {
  features?: Features;
  tables: VuuTableSchemas;
}

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

export const AppSidePanel = ({
  features = NO_FEATURES,
  tables,
}: AppSidePanelProps) => {
  const classBase = "vuuAppSidePanel";

  const gridFeatures = useMemo(
    () =>
      Object.entries(features).map(([featureName, { title, url, css }]) => {
        return {
          className: featureName,
          css,
          js: url,
          title,
        };
      }),
    [features]
  );

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
  }, [gridFeatures, selectedIndex, tables]);

  const toggleButtons = (): ReactElement => {
    const featureNames = Object.keys(features);
    if (featureNames.length === 1) {
      return <div>{gridFeatures[0].title}</div>;
    } else {
      return (
        <ToggleButtonGroup
          onChange={handleChange}
          selectedIndex={selectedIndex}
        >
          {Object.values(features).map(({ title }) => (
            <ToggleButton ariaLabel="alert" key={title} tooltipText="Alert">
              {title}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      );
    }
  };

  Object.keys(features).map((featureName) => (
    <ToggleButton ariaLabel="alert" key={featureName} tooltipText="Alert">
      Vuu Grid
    </ToggleButton>
  ));

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
            {toggleButtons()}
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
