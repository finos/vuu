import {
  AnimationPath,
  FlowingData,
  MovingDots,
  SvgArrow,
} from "./svg-components";

import "./SvgFun.keyframes.css";
import "./SvgFun.examples.css";

let displaySequence = 0;

export const SvgArrowAnimations = () => {
  return (
    <div style={{ display: "flex", gap: 20, height: "100%" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 200"
        style={{
          backgroundColor: "black",
          height: 800,
          width: 400,
        }}
      >
        <FlowingData />
        <SvgArrow />
        <MovingDots />
      </svg>
      <div className="svgFun-pathMap" style={{ width: 400 }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 2200"
          style={{
            backgroundColor: "black",
            height: 1000,
            width: 400,
          }}
        >
          <AnimationPath />
        </svg>
      </div>
      <div className="svgFun-scrollContainer" style={{ width: 400 }}>
        <div className="svgFun-scrollingContent"></div>
      </div>
    </div>
  );
};

SvgArrowAnimations.displaySequence = displaySequence++;
