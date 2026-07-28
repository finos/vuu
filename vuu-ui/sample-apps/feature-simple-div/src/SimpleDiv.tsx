import { useLoggedInUser } from "@vuu-ui/vuu-shell";
import { useData } from "@vuu-ui/vuu-utils2";
import { useMemo } from "react";

import "./SimpleDiv.css";
import { Table } from "@vuu-ui/vuu-table";

const SimpleDiv = () => {
  const user = useLoggedInUser();
  const { VuuDataSource } = useData();

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: ["ric", "currency", "exchange"],
      table: { module: "SIMUL", table: "instruments" },
    });
  }, [VuuDataSource]);

  console.log({ dataSource });

  const config = useMemo(() => {
    return {
      columns: [{ name: "ric" }, { name: "currency" }, { name: "exchange" }],
    };
  }, []);

  return (
    <div className="vuuSimpleDiv">
      <div>Simple Div</div>
      <div>{`Haha sucker ${user.userName}`}</div>
      <Table config={config} dataSource={dataSource} />
    </div>
  );
};

export default SimpleDiv;
