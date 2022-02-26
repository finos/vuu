import React from 'react';
import cx from 'classnames';
import { useControlled } from '../utils';

import './pill.css';

const noop = () => undefined;

export const Pill = ({
  className,
  closeable,
  defaultSelected,
  label,
  prefix,
  selectable,
  onSelect,
  onClose,
  selected: selectedProp,
  ...htmlAttributes
}) => {
  const [selected, setSelected] = useControlled({
    controlled: selectedProp,
    default: defaultSelected,
    name: 'Pill',
    state: 'selected'
  });
  const toggleSelect = () => {
    setSelected((value) => !value);
  };

  console.log({ selected });
  return (
    <div
      className={cx('hwPill', className)}
      aria-selected={selected ?? undefined}
      onClick={selectable ? toggleSelect : noop}
      {...htmlAttributes}>
      {prefix ? <span className="hwPill-prefix">{prefix}</span> : null}
      <span className="hwPill-label">{label}</span>
      {closeable ? <span className="hwPill-close" data-icon="close" /> : null}
    </div>
  );
};
