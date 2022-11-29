import React, { ReactElement, ReactNode, useState } from "react";
import { Footer, Header, InlineHeader } from "./gridAdornments";
const NO_ADORNMENTS = {
  header: { height: 0, component: null },
  inlineHeader: { height: 0, component: null },
  footer: { height: 0, component: null },
};

type adornmentType = "header" | "inlineHeader" | "footer";

export type AdornmentsDescriptor = {
  header: {
    height: number;
    component: null | ReactElement;
  };
  inlineHeader: {
    height: number;
    component: null | ReactElement;
  };
  footer: {
    height: number;
    component: null | ReactElement;
  };
};

export const useAdornments = (children: ReactNode): AdornmentsDescriptor => {
  const [adornments] = useState(
    children ? getAdornments(children) : NO_ADORNMENTS
  );
  return adornments;
};

function getAdornments(children: ReactNode) {
  const adornments = { ...NO_ADORNMENTS };

  if (Array.isArray(children)) {
    children.forEach((child) => {
      addAdornment(adornments, child);
    });
  } else if (React.isValidElement(children)) {
    addAdornment(adornments, children);
  }

  return adornments;
}

function addAdornment(adornments: AdornmentsDescriptor, child: ReactElement) {
  const [type, height, component] = getAdornment(child);
  if (type) {
    if (adornments[type]) {
      console.error(
        `Grid only supports one child of any type: multiple ${type}s`
      );
    } else {
      adornments[type] = { height, component };
    }
  } else {
    console.error(`unable to identify child element`);
  }
}

function getAdornment(
  child: ReactElement
): [adornmentType, number, ReactElement] | [null] {
  if (
    child.type === Header ||
    child.type === Footer ||
    child.type === InlineHeader
  ) {
    const type =
      child.type === Header
        ? "header"
        : child.type === Footer
        ? "footer"
        : "inlineHeader";
    const { height } = child.props;
    if (height === undefined) {
      console.error(`${type} must provide height`);
    }
    return [type, height, child];
  } else {
    return [null];
  }
}
