import React, { useState } from 'react';
import { TextInput } from '@vuu-ui/ui-controls';
import { Form, MultiCellEdit } from '@vuu-ui/ui-forms';
import formConfig, { Select as SelectField } from './Form.config';

import './Form.css';

export default {
  title: 'UI Controls/Form',
  component: Form
};

export const FormLayout = ({ width = 500, height = 400 }) => {
  const [data, setData] = useState({
    legs: [
      {
        field01: 'tinsel',
        field07: ['stevo', 'Java'],
        field11: 'a'
      },
      {
        field01: 'town'
      }
    ]
  });

  const onChange = (field, legIdx, value) => {
    setData({
      ...data,
      legs: data.legs.map((leg, i) => (i === legIdx ? { ...leg, [field.id]: value } : leg))
    });
  };

  return (
    <div className="App">
      <div className="app-header">
        <select defaultValue="">
          <option value=""></option>
          <option value="audi">Audi</option>
          <option value="bmw">BMW</option>
          <option value="seat">Seat</option>
          <option value="volkswagen">Volkswagen</option>
          <option value="volvo">Volvo</option>
        </select>
      </div>
      <Form config={formConfig} data={data} onChange={onChange} />
      <div className="app-footer">
        <TextInput />
      </div>

      <div className="model-debug">
        {data.legs.map((leg, i) => (
          <div key={i} className="model-leg">
            {Object.keys(leg)
              .sort()
              .map((key) => (
                <div key={key} className="model-leg-property">{`${key} : ${leg[key]}`}</div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const FormLayoutSelect = ({ width = 500, height = 400 }) => {
  const [data, setData] = useState({ legs: [{}, {}] });

  const config = {
    layout: {
      groups: [
        {
          id: 'group-1',
          label: null,
          fields: [
            SelectField('field01', 'Field 1', MultiCellEdit),
            SelectField('field02', 'Field 2', MultiCellEdit),
            SelectField('field03', 'Field 3', MultiCellEdit),
            SelectField('field04', 'Field 4', MultiCellEdit),
            SelectField('field05', 'Field 5', MultiCellEdit)
          ]
        },
        {
          id: 'group-2',
          label: null,
          fields: [
            SelectField('field06', 'Field 6', MultiCellEdit),
            SelectField('field07', 'Field 7', MultiCellEdit),
            SelectField('field08', 'Field 8', MultiCellEdit),
            SelectField('field09', 'Field 9', MultiCellEdit),
            SelectField('field10', 'Field 10', MultiCellEdit)
          ]
        }
      ]
    }
  };

  const onChange = (field, legIdx, value) => {
    setData({
      ...data,
      legs: data.legs.map((leg, i) => (i === legIdx ? { ...leg, [field.id]: value } : leg))
    });
  };

  return (
    <div className="App">
      <div className="app-header">
        <TextInput />
        <select defaultValue="">
          <option value=""></option>
          <option value="audi">Audi</option>
          <option value="bmw">BMW</option>
          <option value="seat">Seat</option>
          <option value="volkswagen">Volkswagen</option>
          <option value="volvo">Volvo</option>
        </select>
      </div>
      <Form config={config} data={data} />
      <div className="app-footer">
        <TextInput />
      </div>

      <div className="model-debug">
        {data.legs.map((leg, i) => (
          <div key={i} className="model-leg">
            {Object.keys(leg)
              .sort()
              .map((key) => (
                <div key={key} className="model-leg-property">{`${key} : ${leg[key]}`}</div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};
