import React, {
  CSSProperties,
  HTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import cx from "classnames";

import "./RevolvingCaption.css";

export interface RevolvingCaptionProps extends HTMLAttributes<HTMLDivElement> {
  captions: string[];
  interval?: number;
}

export const RevolvingCaption = ({
  captions: captionsProp,
  interval = 5,
  style,
  ...htmlAttributes
}: RevolvingCaptionProps) => {
  const captions = useMemo(
    () => captionsProp.concat([captionsProp[0]]),
    [captionsProp]
  );
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const revolve = () => {
      if (index === captions.length - 1) {
        setIndex(0);
      } else {
        setIndex(index + 1);
      }
      timerRef.current = undefined;
    };

    if (timerRef.current === undefined) {
      timerRef.current = window.setTimeout(revolve, interval * 1000);
    }
  }, [captions, index]);

  const offset = index * 84;

  const transitionStyle =
    offset === 0
      ? {
          "--vuu-revolving-caption-transitionProperty": `none`,
          "--vuu-revolving-caption-transform": `translateY(0px)`,
        }
      : {
          "--vuu-revolving-caption-transitionProperty": `transform`,
          "--vuu-revolving-caption-transform": `translateY(-${offset}px)`,
        };

  useEffect(() => () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
  });

  return (
    <div
      {...htmlAttributes}
      className="vuuRevolvingCaption"
      style={
        {
          ...transitionStyle,
          ...style,
        } as CSSProperties
      }
    >
      <div className="vuuRevolvingCaption-captionContainer">
        {captions.map((caption, i) => (
          <div
            className={cx("vuu-revolving-caption", {
              "vuu-revolving-caption-exit": i === index - 1,
            })}
            key={i}
          >
            {caption}
          </div>
        ))}
      </div>
    </div>
  );
};
