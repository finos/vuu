import { CircularProgress, LinearProgress } from "@heswell/uitk-lab";
import "@vuu-ui/theme";

import "@heswell/component-anatomy/esm/index.css";

export const LinearDefault = () => (
  <div>
    <div>
      <h3>size=small</h3>
      <LinearProgress size="small" value={38} />
    </div>
    <div style={{ marginTop: 50 }}>
      <h3>size=medium</h3>
      <LinearProgress size="medium" value={38} />
    </div>
    <div style={{ marginTop: 50 }}>
      <h3>size=large</h3>
      <LinearProgress size="large" value={38} />
    </div>
  </div>
);

export const CircularDefault = () => (
  <div style={{ display: "flex" }}>
    <div>
      <h3>size=small</h3>
      <CircularProgress aria-label="Download" size="small" value={100} />
    </div>
    <div style={{ marginLeft: 100 }}>
      <h3>size=medium</h3>
      <CircularProgress aria-label="Download" size="medium" value={38} />
    </div>
    <div style={{ marginLeft: 100 }}>
      <h3>size=large</h3>
      <CircularProgress aria-label="Download" size="large" value={38} />
    </div>
  </div>
);
