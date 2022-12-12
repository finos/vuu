import React, { HTMLAttributes } from "react";
import cx from "classnames";

import "./TokenMirror.css";
import { UIToken } from "@vuu-ui/datagrid-parsers/src/filter-parser/ui-tokens";

const classBase = "vuuTokenMirror";

export interface TokenMirrorProps extends HTMLAttributes<HTMLDivElement> {
  completion?: string;
  tokens: UIToken[];
}

export const TokenMirror = ({
  className,
  completion,
  tokens,
}: TokenMirrorProps) => {
  return (
    <div className={cx(classBase, className)}>
      {tokens.map((token, i) => (
        <span
          key={i}
          className={cx(`${classBase}-token`, `${classBase}-${token.type}`)}
        >
          {token.text}
        </span>
      ))}
      {completion ? (
        <span className={`${classBase}-completion`} key="completion">
          {completion}
        </span>
      ) : null}
    </div>
  );
};
