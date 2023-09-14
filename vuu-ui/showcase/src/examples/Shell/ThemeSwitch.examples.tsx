import { ThemeMode, ThemeSwitch } from "@finos/vuu-shell";
import { useCallback, useState } from "react";

let displaySequence = 1;

export const DefaultThemeSwitch = () => {
  const [mode, setMode] = useState<ThemeMode>("light");
  const handleChange = useCallback((mode: ThemeMode) => {
    setMode(mode);
  }, []);
  return (
    <div
      className="vuuToggleButtonExample"
      style={{
        display: "flex",
        height: 150,
        flexDirection: "column",
        justifyContent: "space-between",
        margin: "0 auto",
        width: "fit-content",
      }}
    >
      <ThemeSwitch mode={mode} onChange={handleChange} />
    </div>
  );
};
DefaultThemeSwitch.displaySequence = displaySequence++;
