import { useMemo } from 'react';
import { uuid } from '@vuu-ui/utils';

export const useId = (idProp) => {
  const id = useMemo(() => {
    return idProp || uuid(5);
  }, [idProp]);
  return id;
};

export const getUniqueId = () => `hw-${Math.round(Math.random() * 1e5)}`;

// import { useEffect, useMemo, useState } from "react";

// const idBase = 'hw';
// let idCount = 1;
// const getId = (id, prefix) => id ?? `${idBase}${prefix}${idCount++}`;

// export function useId(idOverride, prefix='') {
//   const _id = useMemo(() => getId(idOverride, prefix),[idOverride, prefix]);
//   const [id, setDefaultId] = useState(_id);
//   useEffect(() => {
//     if (idOverride) {
//       setDefaultId(idOverride);
//     }
//   }, [idOverride]);
//   return id;
// }

// import { useEffect, useState } from "react";

// export function useId(idOverride) {
//   const [defaultId, setDefaultId] = useState(idOverride);
//   const id = idOverride || defaultId;
//   useEffect(() => {
//     if (defaultId == null) {
//       setDefaultId(getUniqueId());
//     }
//   }, [defaultId]);
//   return id;
// }
