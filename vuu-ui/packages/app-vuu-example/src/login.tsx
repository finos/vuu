import React from 'react';
import ReactDOM from 'react-dom';
import { LoginPanel } from '@vuu-ui/shell';
import { authenticate } from '@vuu-ui/data-remote';
import { ThemeProvider } from '@vuu-ui/theme';

import './login.css';

async function login(username, password) {
  try {
    const authToken = await authenticate(username, password /*, 'https://127.0.0.1:8443'*/);
    var date = new Date();
    const days = 1;
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `vuu-username=${username};expires=${date.toUTCString()};path=/`;
    document.cookie = `vuu-auth-token=${authToken};expires=${date.toUTCString()};path=/`;
    window.location.href = '/index.html';
  } catch (err) {
    console.error(err);
  }
}

ReactDOM.render(
  <ThemeProvider>
    <LoginPanel onSubmit={login} />
  </ThemeProvider>,
  document.getElementById('root')
);
