import React from 'react';
import ReactDOM from 'react-dom';
import { LoginPanel } from '@vuu-ui/shell';
import { ThemeProvider } from '@vuu-ui/theme';

import '@vuu-ui/theme/index.css';
import '@vuu-ui/shell/index.css';
import '@vuu-ui/layout/index.css';
import '@vuu-ui/ui-controls/index.css';
import './login.css';

function login(username, password) {
  fetch(`/api/authn`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'access-control-allow-origin': 'localhost:8443'
    },
    body: JSON.stringify({ username, password })
  })
    .then((response) => {
      var date = new Date();
      const days = 1;
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      const authToken = response.headers.get('vuu-auth-token');
      document.cookie = `vuu-username=${username};expires=${date.toUTCString()};path=/`;
      document.cookie = `vuu-auth-token=${authToken};expires=${date.toUTCString()};path=/`;
      window.location.href = '/index.html';
    })
    .catch((err) => {
      console.log(`error`, err);
    });
}

ReactDOM.render(
  <ThemeProvider>
    <LoginPanel onSubmit={login} />
  </ThemeProvider>,
  document.getElementById('root')
);
