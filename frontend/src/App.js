// App.js
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './Theme'; // Ensure the path to your theme is correct
import QuantiFiBacktestingLab from './components/QuantiFiBacktestingLab';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <QuantiFiBacktestingLab />
      </div>
    </ThemeProvider>
  );
}

export default App;