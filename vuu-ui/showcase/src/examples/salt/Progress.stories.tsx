import { CircularProgress, LinearProgress } from "@salt-ds/lab";

let displaySequence = 1;

export const LinearDefault = () => (
  <div>
    <div>
      <h3>size=small</h3>
      <LinearProgress value={38} />
    </div>
    <div style={{ marginTop: 50 }}>
      <h3>size=medium</h3>
      <LinearProgress value={38} />
    </div>
    <div style={{ marginTop: 50 }}>
      <h3>size=large</h3>
      <LinearProgress value={38} />
    </div>
  </div>
);
LinearDefault.displaySequence = displaySequence++;

export const CircularDefault = () => (
  <div style={{ display: "flex" }}>
    <div>
      <h3>size=small</h3>
      <CircularProgress aria-label="Download" value={100} />
    </div>
    <div style={{ marginLeft: 100 }}>
      <h3>size=medium</h3>
      <CircularProgress aria-label="Download" value={38} />
    </div>
    <div style={{ marginLeft: 100 }}>
      <h3>size=large</h3>
      <CircularProgress aria-label="Download" value={38} />
    </div>
  </div>
);
CircularDefault.displaySequence = displaySequence++;
