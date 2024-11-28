import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Box, Button } from '@mui/material';
import theme from './Theme';
import QuantiFiBacktestingLab from './components/QuantiFiBacktestingLab';
import Auth from './components/Auth';

function App() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));

  const handleLogin = (token) => {
    setAccessToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setAccessToken(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {accessToken ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
              <Button 
                onClick={handleLogout}
                variant="outlined"
                color="primary"
              >
                Logout
              </Button>
            </Box>
            <QuantiFiBacktestingLab accessToken={accessToken} />
          </>
        ) : (
          <Auth onLogin={handleLogin} />
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;

