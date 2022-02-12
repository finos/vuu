import {
  EditEmpty,
  MultiCellEdit,
  SingleCellEdit,
  EditReadOnly,
  TEXT,
  DATE,
  COMBO,
  SELECT,
  TOGGLE
} from '@vuu-ui/ui-forms';

export const TEXT_INPUT = 'TextInput';

const getLegValue = (id) => (model, i) => model.legs[i][id] || '';
const getCompositeLegValue = (id) => (model, legIdx, compositeIdx) => {
  const leg = model.legs[legIdx];
  if (leg) {
    const value = leg[id];
    if (Array.isArray(value)) {
      return value[compositeIdx] === undefined ? '' : value[compositeIdx];
    }
  }
  return '';
};

const Field1 = {
  id: 'field01',
  label: 'Field 1 TXT*',
  getValue: getLegValue('field01'),
  type: TEXT,
  layout: MultiCellEdit
};
const Field2 = {
  id: 'field02',
  label: 'Field 2 DAT',
  getValue: getLegValue('field02'),
  type: DATE,
  layout: SingleCellEdit
};
const Field3 = {
  id: 'field03',
  label: 'Field 3 CMB*',
  getValue: getLegValue('field03'),
  type: COMBO,
  layout: MultiCellEdit
};
const Field4 = {
  id: 'field04',
  label: 'Field 4 TXT*',
  getValue: getLegValue('field04'),
  type: TEXT,
  layout: EditEmpty
};

const Field5 = {
  id: 'field05',
  label: 'Field 5 SEL*',
  getValue: getLegValue('field05'),
  type: SELECT,
  layout: MultiCellEdit
};
const Field7 = {
  id: 'field07',
  label: 'Field 7 T/C*',
  getValue: getCompositeLegValue('field07'),
  type: [TEXT, COMBO],
  layout: MultiCellEdit
};
const Field8 = {
  id: 'field08',
  label: 'Field 8 TXT*',
  getValue: getLegValue('field08'),
  type: TEXT,
  layout: MultiCellEdit
};
const Field9 = {
  id: 'field09',
  label: 'Field 9 TXT*',
  getValue: getLegValue('field09'),
  type: TEXT,
  layout: MultiCellEdit
};

const Field10 = {
  id: 'field10',
  label: 'Field 10 (D/C)',
  getValue: getCompositeLegValue('field10'),
  type: [DATE, COMBO],
  layout: MultiCellEdit
};
const Field11 = {
  id: 'field11',
  label: 'Field 11 (Txt)',
  getValue: getLegValue('field11'),
  type: TEXT,
  layout: MultiCellEdit
};

const Field12 = {
  id: 'field12',
  label: 'Field 10 (T/D/C)',
  getValue: getCompositeLegValue('field12'),
  type: [TEXT, DATE, COMBO],
  layout: SingleCellEdit
};

const Field13 = {
  id: 'field13',
  label: 'Field 13 (T or S)',
  getValue: getLegValue('field13'),
  type: TEXT,
  // TODO not sure if this gets copied when we use spread
  getType(model) {
    return model.field11 === 'a' ? (this.type = COMBO) : (this.type = TEXT);
  },
  layout: MultiCellEdit
};

const Field14 = {
  id: 'field14',
  label: 'Field 14 (Tog)',
  getValue: getLegValue('field13'),
  type: TOGGLE,
  values: ['Buy', 'Sell'],
  shortcuts: ['b', 's'],
  layout: MultiCellEdit
};

const Field15 = {
  id: 'field15',
  label: 'Field 15 (Txt)',
  getValue: getLegValue('field15'),
  type: TEXT,
  layout: MultiCellEdit
};

const leggyModel = {
  layout: {
    groups: [
      {
        id: 'group-1',
        label: null,
        fields: [Field1, Field2, Field3, Field4, Field5]
      },
      {
        id: 'group-2',
        label: null,
        fields: [Field7, Field8, Field9, Field10, Field11, Field12, Field13, Field14, Field15]
      }
    ]
  }
};

export default leggyModel;

export const Select = (id, label, layout) => ({
  type: SELECT,
  id,
  label,
  layout,
  getValue: getLegValue(id)
});
