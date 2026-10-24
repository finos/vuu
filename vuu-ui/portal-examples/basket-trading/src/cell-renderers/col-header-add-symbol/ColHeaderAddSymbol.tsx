import { Button } from "@salt-ds/core";
import { useContextPanel } from "@vuu-ui/core";
import { useSessionDataSource } from "@vuu-ui/vuu-data-react";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { MouseEventHandler, useCallback, useMemo } from "react";
import { ConstituentSearch } from "./ConstituentSearch";

import "./ColHeaderAddSymbol.css";

const classBase = "vuuColHeaderAddSymbol";

export const ColHeaderAddSymbol = () => {
  const showContextPanel = useContextPanel();
  const { getDataSource } = useSessionDataSource();

  const dataSource = useMemo(() => {
    const ds = getDataSource("data-source-basket-constituent");
    if (ds) {
      return ds;
    } else {
      throw Error(
        "ColHeaderAddSymbol expects Basket Constituent datasource to be available in session store",
      );
    }
  }, [getDataSource]);

  const handleClick = useCallback<MouseEventHandler>(
    (e) => {
      e.stopPropagation();
      showContextPanel(
        <ConstituentSearch dataSource={dataSource} />,
        "Add constituent",
      );
    },
    [dataSource, showContextPanel],
  );

  return (
    <span className={classBase}>
      <Button
        appearance="transparent"
        aria-label="Add constituent"
        title="Add constituent"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={handleClick}
        sentiment="neutral"
      >
        <Icon name="add" />
      </Button>
    </span>
  );
};
