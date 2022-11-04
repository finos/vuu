import { useEffectSkipFirst } from "@vuu-ui/react-utils";

// Invoke datasource api methods when gridModel properties change
export default function useDataSourceModelBindings(dataSource, gridModel) {
  // useEffectSkipFirst(() => {
  //   dataSource.setGroupState(gridModel.groupState);
  // }, [dataSource, gridModel.groupState]);
  //   useEffectSkipFirst(() => {
  //     console.log(`setSubscribedColumns`);
  //     dataSource.setSubscribedColumns(gridModel.columnNames);
  //   }, [dataSource, gridModel.columnNames]);
}
