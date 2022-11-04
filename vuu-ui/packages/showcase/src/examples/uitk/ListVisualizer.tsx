import { createContext, useCallback, useContext, useState } from "react";

const ListVizContext = createContext<unknown>({});

export const useListViz = () => useContext(ListVizContext);

const format = (data) =>
  Array.isArray(data)
    ? data.map((item) => `\n${item.element.textContent}`).join("")
    : "";

const colours = ["rgba(255,0,0,.3)", "rgba(0,255,255,.3 )"];

export const ListVisualizer: React.FC<unknown> = ({ children }) => {
  const [content, setContent] = useState([]);
  const [vizKey, setVisKey] = useState(1);

  const setMeasurements = useCallback((measurements: any) => {
    console.log(`setContent`, {
      measurements,
    });
    setContent(measurements);
    setVisKey((vk) => vk + 1);
  }, []);

  console.log(`render VIZ`);
  return (
    <ListVizContext.Provider value={{ setMeasurements }}>
      <div style={{ display: "flex" }}>
        <div style={{ flex: "250px 0 0" }}>{children}</div>
        <div data-key={vizKey} style={{ flex: "auto 1 1" }}>
          {content.map((item, i) => (
            <div
              key={i}
              style={{
                alignItems: "center",
                background: colours[i % 2],
                display: "flex",
                position: "absolute",
                height: item.size,
                top: item.start,
                transition: "top .3s linear",
                width: "100%",
              }}
            >
              {`[${item.index}] [${item.currentIndex}] ${item.element.textContent}`}
            </div>
          ))}
        </div>
      </div>
    </ListVizContext.Provider>
  );
};
