import React, { useState } from 'react';

interface TestVuuInputProps {
  onCommit?: (value: string) => void;
  errorMessage?: string;
  'data-testid'?: string;
}

export const TestVuuInput = ({ onCommit, errorMessage, 'data-testid': testId }: TestVuuInputProps) => {
  const [value, setValue] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const inputValue = (e.target as HTMLInputElement).value;
      setHasError(!!errorMessage);
      onCommit?.(inputValue);
    }
  };

  return (
    <div className={`vuuInput${hasError ? ' vuuInput-error' : ''}`} data-testid={testId || 'vuu-input'}>
      <input
        className="saltInput-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {hasError && errorMessage && (
        <div className="vuuInput-errorIcon" title={errorMessage}>
          ⚠️
        </div>
      )}
      {hasError && errorMessage && (
        <div className="saltTooltip">{errorMessage}</div>
      )}
    </div>
  );
};
