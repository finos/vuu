import { formatDate } from "@finos/vuu-utils";
import { List, ListItem, ListItemProps } from "@salt-ds/lab";
import { Button } from "@salt-ds/core";
import { ExportIcon } from "@salt-ds/icons";
import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  useCallback,
  useEffect,
  useState,
} from "react";
import { getLayoutHistory, LayoutHistoryItem } from "../get-layout-history";
import { logout } from "../login";
import { VuuUser } from "../shell";

import "./UserPanel.css";

const byLastUpdate = (
  { lastUpdate: l1 }: LayoutHistoryItem,
  { lastUpdate: l2 }: LayoutHistoryItem
) => {
  return l2 === l1 ? 0 : l2 < l1 ? -1 : 1;
};

type HistoryEntry = {
  id: string;
  label: string;
  lastUpdate: number;
};

const HistoryListItem = (props: ListItemProps<HistoryEntry>) => {
  return <ListItem {...props} />;
};

export interface UserPanelProps extends HTMLAttributes<HTMLDivElement> {
  loginUrl?: string;
  onNavigate: (id: string) => void;
  user: VuuUser;
  layoutId: string;
}

export const UserPanel = forwardRef(function UserPanel(
  { loginUrl, onNavigate, user, layoutId = "latest" }: UserPanelProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    async function getHistory() {
      const history = await getLayoutHistory(user);
      const sortedHistory = history
        .filter((item) => item.id !== "latest")
        .sort(byLastUpdate)
        .map<HistoryEntry>(({ id, lastUpdate }) => ({
          lastUpdate,
          id,
          label: `Saved at ${formatDate("hh:mm:ss")(new Date(lastUpdate))}`,
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

  const handleLogout = useCallback(() => {
    logout(loginUrl);
  }, [loginUrl]);

  const selected =
    history.length === 0
      ? null
      : layoutId === "latest"
      ? history[0]
      : history.find((i) => i.id === layoutId);

  return (
    <div className="vuuUserPanel" ref={forwardedRef}>
      <List<HistoryEntry>
        ListItem={HistoryListItem}
        className="vuuUserPanel-history"
        onSelect={handleHisorySelected}
        selected={selected}
        source={history}
      />
      <div className="vuuUserPanel-buttonBar">
        <Button aria-label="logout" onClick={handleLogout}>
          <ExportIcon /> Logout
        </Button>
      </div>
    </div>
  );
});
