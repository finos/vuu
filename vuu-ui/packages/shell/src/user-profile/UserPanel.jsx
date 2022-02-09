import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { Button, List, ListItem } from '@vuu-ui/ui-controls';
import { logout } from '../login';
import { getLayoutHistory } from '../get-layout-history';

import './UserPanel.css';

export const UserPanel = forwardRef(function UserPanel({ onNavigate, user }, forwardedRef) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function getHistory() {
      const history = await getLayoutHistory(user);
      setHistory(history);
    }
    getHistory();
  }, [user]);

  const handleHisorySelected = useCallback((evt, [selected]) => {
    if (selected) {
      onNavigate(selected.props.id);
    }
  }, []);

  return (
    <div className="vuuUserPanel" ref={forwardedRef}>
      <List onChange={handleHisorySelected}>
        {history.map(({ id, uniqueId, lastUpdate }) => (
          <ListItem id={id} key={id} label={uniqueId} />
        ))}
      </List>
      <Button aria-label="logout" className="btn-logout" data-icon="logout" onClick={logout}>
        Logout
      </Button>
    </div>
  );
});
