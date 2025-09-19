import React from 'react';

export const TestBareBonesPrompt = () => {
  return (
    <div role="dialog" className="vuuPrompt">
      This is Prompt text
    </div>
  );
};

export const TestConfirmOnly = () => {
  return (
    <div role="dialog" className="vuuPrompt">
      This is Prompt text that will not wrap because minWidth has been
      specified, not width
      <button autoFocus>OK</button>
    </div>
  );
};

export const TestFocusOnConfirm = () => {
  return (
    <div role="dialog" className="vuuPrompt">
      This is Prompt text
      <button>Cancel</button>
      <button>Close</button>
      <button autoFocus>Confirm</button>
    </div>
  );
};
