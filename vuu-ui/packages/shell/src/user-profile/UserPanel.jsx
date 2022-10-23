import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { formatDate } from "@vuu-ui/ui-controls";
import { logout } from "../login";
import { getLayoutHistory } from "../get-layout-history";
import { ExportIcon } from "@heswell/uitk-icons";
import { Button } from "@heswell/uitk-core";
import { List, ListItem } from "@heswell/uitk-lab";

import "./UserPanel.css";

const byLastUpdate = ({ lastUpdate: l1 }, { lastUpdate: l2 }) => {
  return l2 === l1 ? 0 : l2 < l1 ? -1 : 1;
};

const HistoryListItem = (props) => {
  return <ListItem {...props} />;
};

export const UserPanel = forwardRef(function UserPanel(
  { onNavigate, user, layoutId = "latest" },
  forwardedRef
) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function getHistory() {
      const history = await getLayoutHistory(user);
      console.log({ history });
      const sortedHistory = history
        .filter((item) => item.id !== "latest")
        .sort(byLastUpdate)
        .map(({ id, lastUpdate }) => ({
          lastUpdate,
          id,
          label: `Saved at ${formatDate(new Date(lastUpdate), "kk:mm:ss")}`,
        }));
      console.log({ sortedHistory });
      setHistory(sortedHistory);
    }

    getHistory();
  }, [user]);

  const handleHisorySelected = useCallback(
    (evt, selected) => {
      if (selected) {
        onNavigate(selected.id);
      }
    },
    [onNavigate]
  );

  const selected =
    history.length === 0
      ? []
      : layoutId === "latest"
      ? history[0]
      : history.find((i) => i.id === layoutId);
  console.log({ selected });

  return (
    <div className="vuuUserPanel" ref={forwardedRef}>
      <List
        ListItem={HistoryListItem}
        className="vuuUserPanel-history"
        onSelect={handleHisorySelected}
        selected={selected}
        source={history}
      />
      <div className="vuuUserPanel-buttonBar">
        <Button aria-label="logout" onClick={logout}>
          <ExportIcon /> Logout
        </Button>
      </div>
    </div>
  );
});
