import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, teamsLightTheme, teamsDarkTheme } from '@fluentui/react-components';
import App from './App';
import './styles/main.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <FluentProvider theme={teamsDarkTheme}>
      <App />
    </FluentProvider>
  </React.StrictMode>
);
