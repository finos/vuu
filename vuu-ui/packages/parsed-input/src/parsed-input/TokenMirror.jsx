import React from 'react';
import cx from 'classnames';

import './TokenMirror.css';

const classBase = 'hwTokenMirror';

export const TokenMirror = ({ className, completion, tokens }) => {
  return (
    <div className={cx(classBase, className)}>
      {tokens.map((token, i) => (
        <span key={i} className={cx(`${classBase}-token`, `${classBase}-${token.type}`)}>
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
