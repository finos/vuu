import React, { useCallback, useEffect, useMemo } from "react";
import { useLayoutContext } from "@vuu-ui/layout";
import { Grid } from "@vuu-ui/data-grid";
import { createDataSource, useViewserver } from "@vuu-ui/data-remote";



export const MetricsTable = ({ onServiceRequest, schema, ...props }) => {
  const { id, dispatch, load, save, loadSession, saveSession } =
    useLayoutContext();
  const config = useMemo(() => load(), [load]);

  const dataSource = useMemo(() => {
    let ds = loadSession("data-source");
    if (ds) {
      return ds;
    }
    ds = createDataSource({ id, tableName: schema.table, schema, config });
    saveSession(ds, "data-source");
    return ds;
  }, [config, id, loadSession, saveSession, schema]);

  useEffect(() => {
    console.log(`%cMetricsTable MOUNTED`,'color:blue;font-weight:bold;font-size: 16px')
    return () => {
      console.log(`%cMetricsTable UNMOUNTED`,'color:brown;font-weight:bold;font-size: 16px')
    }
  },[])

  useEffect(() => {
    console.log(`FilteredGrid mounted, resume dataSource suspended ${dataSource.suspended}`);
    dataSource.resume();
    return () => {
      console.log(`%cFilteredGrid unmounted, suspend dataSource`,'color:red;font-weight:bold;');
      dataSource.suspend();
    };
  }, [dataSource]);

  const unlink = () => {
    console.log("unlink");
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
        case "visual-link-created":
          dispatch({
            type: "toolbar-contribution",
            location: "post-title",
            content: <Button aria-label="remove-link" onClick={unlink}><LinkIcon /></Button>,
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

