import { isCharacterKey } from '@vuu-ui/utils';

export function searcher(values, callback) {
  let keyDownTimer = null;
  let searchChars = '';

  // KeyboardHandler
  return (e) => {
    if (isCharacterKey(e)) {
      if (keyDownTimer !== null) {
        clearTimeout(keyDownTimer);
      }
      searchChars += e.key;
      keyDownTimer = setTimeout(applySearch, 100);
    }
  };

  function applySearch() {
    const regex = new RegExp(`^${searchChars}`, 'i');
    const hilitedIdx = values.findIndex(({ label }) => regex.test(label));
    searchChars = '';
    keyDownTimer = null;

    if (hilitedIdx !== -1) {
      callback(hilitedIdx);
    }
  }
}
