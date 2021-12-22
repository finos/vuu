import React from 'react';
import { TextInput, ComboBox, DatePicker, Select, Toggle } from '@vuu-ui/ui-controls';

import { COMBO, SELECT, DATE, TOGGLE } from '../form-field/control-types';
import CompositeControl from '../controls/composite-control';

import { usa_states } from './usa_states';

export function renderFormControl(field, leg, data, onChange, resolveType = true) {
  const { type } = field;

  if (resolveType && field.getType) {
    return renderFormControl(
      {
        ...field,
        type: field.getType(data.legs[leg])
      },
      leg,
      data,
      onChange,
      false
    );
  } else if (Array.isArray(type)) {
    return (
      <CompositeControl field={field}>
        {type.map((type, idx) => _renderControl(type, field, leg, data, onChange, idx))}
      </CompositeControl>
    );
  } else if (typeof type === 'function') {
    const currentType = type(data);
    return renderFormControl(
      {
        ...field,
        type: currentType
      },
      leg,
      data,
      onChange
    );
  } else {
    return _renderControl(type, field, leg, data, onChange);
  }
}

function _renderControl(
  type,
  field,
  leg,
  data,
  onChange,
  idx,
  onCommit = (value) => onChange(field, leg, value)
) {
  const props = {
    key: idx,
    defaultValue: field.getValue(data, leg, idx),
    onCommit
  };

  switch (type) {
    case COMBO:
      return <ComboBox {...props} values={usa_states} />;
    case DATE:
      return <DatePicker {...props} />;
    case TOGGLE:
      return <Toggle {...props} values={field.values} shortcuts={field.shortcuts} />;
    case SELECT:
      return <Select {...props} values={usa_states} />;
    default:
      return <TextInput {...props} />;
  }
}
