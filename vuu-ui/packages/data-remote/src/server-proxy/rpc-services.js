export const getRpcService = (method) => {
  switch (method) {
    case 'getUniqueFieldValues':
      return ['TypeAheadRpcHandler', 'TYPEAHEAD'];
    default:
      return ['OrderEntryRpcHandler', 'SIMUL'];
  }
};
