import { useState } from 'react';

export const useForceRender = () => {
  const [, forceUpdate] = useState({});
  return forceUpdate;
};
