import VuuInstrumentTilesFeature from "./VuuInstrumentTilesFeature";

import { createRoot } from "react-dom/client";

async function start(): Promise<void> {
  const container = document.getElementById("root");
  if (!container) throw new Error("Root element not found");

  const root = createRoot(container);
  root.render(<VuuInstrumentTilesFeature />);
}

start();
