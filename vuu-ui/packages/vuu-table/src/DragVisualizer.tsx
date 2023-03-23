import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import cx from "classnames";
import { MeasuredDropTarget } from "@heswell/salt-lab";

import "./DragVisualizer.css";

const DragVizContext = createContext<unknown>({});

export const useListViz = () => useContext(DragVizContext);

export interface DragVisualizerProps {
  children: ReactNode;
  orientation?: "vertical" | "horizontal";
}

export const DragVisualizer: React.FC<DragVisualizerProps> = ({
  children,
  orientation = "vertical",
}) => {
  const [content, setContent] = useState<MeasuredDropTarget[]>([]);
  const [dropTarget, setDropTarget] = useState<MeasuredDropTarget>();
  const [dropZone, setDropZone] = useState([]);
  const [vizKey, setVisKey] = useState(1);
  const vizRootRef = useRef<HTMLDivElement>(null);
  const vizRootOffset = useRef(0);

  const setMeasurements = useCallback(
    (
      measurements: MeasuredDropTarget[],
      dropTarget: MeasuredDropTarget,
      dropZone = ""
    ) => {
      console.log(measurements);
      setContent(measurements);
      setDropTarget(dropTarget);
      setDropZone(dropZone);
      setVisKey((vk) => vk + 1);
    },
    []
  );

  const isHorizontal = orientation === "horizontal";
  const flexDirection = isHorizontal ? "column" : "row";
  const START = isHorizontal ? "left" : "top";
  const DIMENSION = isHorizontal ? "width" : "height";

  useLayoutEffect(() => {
    if (vizRootRef.current) {
      const { left } = vizRootRef.current.getBoundingClientRect();
      vizRootOffset.current = left;
    }
  }, []);

  return (
    <DragVizContext.Provider value={{ setMeasurements }}>
      <div style={{ display: "flex", flexDirection, width: 900, height: 1200 }}>
        <div style={{ flex: "250px 0 0" }}>{children}</div>
        <div data-key={vizKey} style={{ flex: "auto 1 1" }} ref={vizRootRef}>
          {content.map((item, i) => (
            <div
              className={cx("DragVizItem", {
                ["ListVizItem-dropTarget"]: item === dropTarget,
                [`ListVizItem-dropTarget-${dropZone}`]: item === dropTarget,
              })}
              key={i}
              style={{
                alignItems: "center",
                justifyContent: "flex-start",
                display: "flex",
                flexDirection: "column",
                position: "absolute",
                height: isHorizontal ? 100 : undefined,
                width: isHorizontal ? undefined : "100%",
                [DIMENSION]: item.size,
                [START]: item.start - vizRootOffset.current,
                transition: "top .3s linear",
              }}
            >
              <span>{item.id}</span>
              <span>{`[${item.index}]`}</span>
              <span>{`[${item.currentIndex}]`}</span>
            </div>
          ))}
        </div>
      </div>
    </DragVizContext.Provider>
  );
};
