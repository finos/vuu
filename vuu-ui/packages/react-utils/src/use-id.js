import { useMemo } from 'react';
import { uuid } from '@vuu-ui/utils';

export const useId = (idProp) => {
  const id = useMemo(() => {
    return idProp || uuid(5);
  }, [idProp]);
  return id;
};

export const getUniqueId = () => `hw-${Math.round(Math.random() * 1e5)}`;
