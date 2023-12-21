import cx from "clsx";
import { createContext, useCallback, useContext, useState } from "react";

import "./ListVisualizer.css";

const ListVizContext = createContext<unknown>({});

export const useListViz = () => useContext(ListVizContext);

type Measurement = {
  currentIndex: number;
  element: HTMLElement;
  index: number;
  size: number;
  start: number;
};

export const ListVisualizer: React.FC<unknown> = ({ children }) => {
  const [content, setContent] = useState<Measurement[]>([]);
  const [dropTarget, setDropTarget] = useState<unknown>();
  const [dropZone, setDropZone] = useState([]);
  const [vizKey, setVisKey] = useState(1);

  const setMeasurements = useCallback(
    (measurements: any, dropTarget: any, dropZone = "") => {
      setContent(measurements);
      setDropTarget(dropTarget);
      setDropZone(dropZone);
      setVisKey((vk) => vk + 1);
    },
    []
  );

  return (
    <ListVizContext.Provider value={{ setMeasurements }}>
      <div style={{ display: "flex" }}>
        <div style={{ flex: "250px 0 0" }}>{children}</div>
        <div data-key={vizKey} style={{ flex: "auto 1 1" }}>
          {content.map((item, i) => (
            <div
              className={cx("ListVizItem", {
                ["ListVizItem-dropTarget"]: item === dropTarget,
                [`ListVizItem-dropTarget-${dropZone}`]: item === dropTarget,
              })}
              key={i}
              style={{
                alignItems: "center",
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
