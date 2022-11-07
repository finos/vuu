import React, { useCallback, useEffect, useMemo } from "react";
import { useViewContext } from "@vuu-ui/vuu-layout";
import { Grid } from "@vuu-ui/vuu-datagrid";
import { createDataSource } from "@vuu-ui/vuu-data";

export const MetricsTable = ({ onServiceRequest, schema, ...props }) => {
  const { id, dispatch, load, save, loadSession, saveSession } =
    useViewContext();
  const config = useMemo(() => load(), [load]);

  const dataSource = useMemo(() => {
    let ds = loadSession("data-source");
    if (ds) {
      return ds;
    }
    ds = createDataSource({ id, table: schema.table, schema, config });
    saveSession(ds, "data-source");
    return ds;
  }, [config, id, loadSession, saveSession, schema]);

  useEffect(() => {
    dataSource.resume();
    return () => {
      dataSource.suspend();
    };
  }, [dataSource]);

  const unlink = () => {
    // nothing yet
  };

  const handleConfigChange = useCallback(
    ({ type, ...op }) => {
      // TODO consolidate these messages
      switch (type) {
        case "group":
          save(op.groupBy, type);
          dispatch({ type: "save" });
          break;
        case "sort":
          save(op.sort, type);
          dispatch({ type: "save" });
          break;
        case "filter":
          save(op.filter, type);
          dispatch({ type: "save" });
          break;
        case "CREATE_VISUAL_LINK_SUCCESS":
          dispatch({
            type: "toolbar-contribution",
            location: "post-title",
            content: (
              <Button aria-label="remove-link" onClick={unlink}>
                <LinkIcon />
              </Button>
            ),
          });
          save(op, "visual-link");
          dispatch({ type: "save" });
          break;
        default:
          console.log(`unknown config change type ${type}`);
      }
    },
    [dispatch, save]
  );

  return (
    <Grid
      {...props}
      dataSource={dataSource}
      columns={schema.columns}
      groupBy={config?.group}
      onConfigChange={handleConfigChange}
      renderBufferSize={80}
      selectionModel="extended"
      sort={config?.sort}
    />
  );
};
