import { SystemLayoutMetadata } from "@finos/vuu-utils";
import { screenshots } from "./layout-screenshots";

const layouts = {
  yellow: {
    type: "Placeholder",
    props: {
      "data-testid": "custom-placeholder1",
      style: {
        background: "yellow",
      },
    },
  },
  red: {
    type: "Placeholder",
    props: {
      "data-testid": "custom-placeholder2",
      style: {
        background: "red",
      },
    },
  },
  green: {
    type: "Placeholder",
    props: {
      "data-testid": "custom-placeholder3",
      style: {
        background: "green",
      },
    },
  },
};

export const sysLayouts: SystemLayoutMetadata[] = [
  {
    id: "sysLayout-01",
    group: "System",
    name: "SystemLayout-Yellow",
    created: "27.08.2024",
    screenshot: screenshots.yellow,
    user: "all",
    layoutJSON: layouts.yellow,
  },
  {
    id: "sysLayout-02",
    group: "System",
    name: "SystemLayout-Red",
    created: "27.08.2024",
    screenshot: screenshots.red,
    user: "all",
    layoutJSON: layouts.red,
  },
  {
    id: "sysLayout-03",
    group: "System",
    name: "SystemLayout-Green",
    created: "27.08.2024",
    screenshot: screenshots.green,
    user: "all",
    layoutJSON: layouts.green,
  },
];
