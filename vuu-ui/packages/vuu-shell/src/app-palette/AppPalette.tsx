import React from "react";
import cx from "classnames";
import {
  ComponentRegistry,
  isRegistered,
  Palette,
  PaletteItem,
} from "@vuu-ui/vuu-layout";

const getPaletteItems = (config) => {
  const paletteItems = [];

  config.forEach((configItem) => {
    const { label, items = [] } = configItem;
    paletteItems.push(
      <div key={label} data-header>
        {label}
      </div>
    );
    items.forEach((paletteItem, i) => {
      const { component, type, props, ...args } = paletteItem;
      if (component) {
        paletteItems.push(
          <PaletteItem {...args} key={i}>
            {component}
          </PaletteItem>
        );
      } else if (type && isRegistered(type)) {
        const Component = ComponentRegistry[type];
        paletteItems.push(
          <PaletteItem {...args} key={i}>
            {React.createElement(Component, {
              ...props,
              key: i,
            })}
          </PaletteItem>
        );
      }
    });
  });

  return paletteItems;
};

export const AppPalette = ({ className, config, ...props }) => {
  return (
    <Palette
      className={cx("TableList", className)}
      orientation="vertical"
      collapsibleHeaders
      {...props}
    >
      {getPaletteItems(config)}
    </Palette>
  );
};
