import BackgroundCell from './cell-renderers/background-cell';
import CheckboxCell from './cell-renderers/checkbox-cell';
import ProgressCell from './cell-renderers/progress-cell';

const renderers = {
  background: BackgroundCell,
  progress: ProgressCell,
  'checkbox-cell': CheckboxCell
};

export default renderers;
