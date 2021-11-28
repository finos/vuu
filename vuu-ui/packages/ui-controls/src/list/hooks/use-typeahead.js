import { searcher } from '../searcher';
import { isCharacterKey } from '../../utils';

export const useTypeahead = ({ hiliteItemAtIndex, typeToNavigate, source }) => {
  const searchKeyHandler = typeToNavigate ? searcher(source, hiliteItemAtIndex) : null;

  const listProps = {
    onKeyDown: (e) => {
      if (isCharacterKey(e)) {
        e.preventDefault();
        searchKeyHandler(e);
      }
    }
  };

  return { listProps };
};
