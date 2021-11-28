// copied from utils
// const navigationKeys = new Set(["Home", "End", "ArrowRight", "ArrowLeft","ArrowDown", "ArrowUp"]);
const navigationKeys = new Set(['Home', 'End', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']);

export const isNavigationKey = ({ key }) => {
  return navigationKeys.has(key);
};

export const useKeyboardNavigation = ({ model, navigate, onCancel, onCommit }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel && onCancel();
    } else if (e.key === 'Enter') {
      onCommit && onCommit(model.currentDate);
    } else if (isNavigationKey(e)) {
      const { currentDate } = model;
      const nextDate = model.nextDate(e.key);
      if (nextDate !== currentDate) {
        navigate(nextDate);
      }
    }
  };

  return handleKeyDown;
};
