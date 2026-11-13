import { Button } from "@salt-ds/core";
import { useContextPanel } from "@vuu-ui/core";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { MouseEventHandler, useCallback } from "react";
import { useBasketConstituentsDataSource } from "../../basket-session";
import { ConstituentSearch } from "./ConstituentSearch";

import "./ColHeaderAddSymbol.css";

const classBase = "vuuColHeaderAddSymbol";

export const ColHeaderAddSymbol = () => {
  const showContextPanel = useContextPanel();
  const dataSource = useBasketConstituentsDataSource();

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
