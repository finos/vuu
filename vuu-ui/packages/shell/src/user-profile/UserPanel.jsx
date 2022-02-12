import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { Button, formatDate, List, ListItem } from '@vuu-ui/ui-controls';
import { logout } from '../login';
import { getLayoutHistory } from '../get-layout-history';

import './UserPanel.css';

const byLastUpdate = ({ lastUpdate: l1 }, { lastUpdate: l2 }) => {
  return l2 === l1 ? 0 : l2 < l1 ? -1 : 1;
};

export const UserPanel = forwardRef(function UserPanel(
  { onNavigate, user, layoutId = 'latest' },
  forwardedRef
) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function getHistory() {
      const history = await getLayoutHistory(user);
      console.log({ history });
      const sortedHistory = history
        .filter((item) => item.id !== 'latest')
        .sort(byLastUpdate)
        .map(({ id, lastUpdate }) => ({
          lastUpdate,
          id,
          label: `Saved at ${formatDate(new Date(lastUpdate), 'kk:mm:ss')}`
        }));
      console.log({ sortedHistory });
      setHistory(sortedHistory);
    }

    getHistory();
  }, [user]);

  const handleHisorySelected = useCallback(
    (evt, [selected]) => {
      if (selected) {
        onNavigate(selected.props.id);
      }
    },
    [onNavigate]
  );

  const selected = history.length === 0 ? [] : layoutId === 'latest' ? history[0].id : [layoutId];

  return (
    <div className="vuuUserPanel" ref={forwardedRef}>
      <List className="vuuUserPanel-history" onChange={handleHisorySelected} selected={selected}>
        {history.map(({ id, label }) => (
          <ListItem id={id} key={id} label={label} />
        ))}
      </List>
      <div className="vuuUserPanel-buttonBar">
        <Button aria-label="logout" className="btn-logout" data-icon="logout" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  );
});
