// components/MyBacktestsDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Button,
  Divider,
  Tooltip,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { BASE_URL } from './config';
import axios from 'axios';

const formatMetric = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    // Format as percentage with two decimal places
    return `${(value * 100).toFixed(2)}%`;
  };
  
  const formatSharpeRatio = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return value.toFixed(2);
  };

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const MyBacktestsDialog = ({ 
  open, 
  onClose, 
  accessToken,
  onLoadBacktest 
}) => {
  const [backtests, setBacktests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBacktest, setSelectedBacktest] = useState(null);

  const fetchBacktests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response  = await axios.get(`${BASE_URL}/api/backtest/saved`, {withCredentials: true});
      
      console.log(response.data)
      const data = await response.data;
      setBacktests(data);
    } catch (err) {
      setError('Failed to load backtests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBacktests();
    }
  }, [open]);

  const handleBacktestClick = (backtest) => {
    setSelectedBacktest(backtest);
  };

  const handleLoadBacktest = () => {
    if (selectedBacktest) {
      onLoadBacktest(selectedBacktest);
      onClose();
    }
  };

  const BacktestDetails = ({ backtest }) => (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {backtest.name}
      </Typography>
      
      <Box mb={2}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Configuration
        </Typography>
        <Typography variant="body2">Symbol: {backtest.config.symbol}</Typography>
        <Typography variant="body2">
          Period: {formatDate(backtest.config.start)} to {formatDate(backtest.config.end)}
        </Typography>
        <Typography variant="body2">
          Strategies: {backtest.config.strategies.length}
        </Typography>
        <Typography variant="body2">
          Data Source: {backtest.config.data_source}
        </Typography>
      </Box>

      <Box mb={2}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Key metric
        </Typography>
        <Typography variant="body2">
            Total Return: {formatMetric(backtest.metric.total_performance)}
            </Typography>
            <Typography variant="body2">
            Sharpe Ratio: {formatSharpeRatio(backtest.metric.sharpe_ratio)}
            </Typography>
            <Typography variant="body2">
            Max Drawdown: {formatMetric(backtest.metric.max_drawdown)}
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Created
        </Typography>
        <Typography variant="body2">
          {formatDate(backtest.created_at)}
        </Typography>
      </Box>

      <Button
        variant="contained"
        color="primary"
        startIcon={<PlayIcon />}
        onClick={handleLoadBacktest}
        fullWidth
        sx={{ mt: 2 }}
      >
        Load & Run Backtest
      </Button>
    </Paper>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">My Backtests</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box display="flex" justifyContent="center" p={3}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : backtests.length === 0 ? (
          <Box display="flex" justifyContent="center" p={3}>
            <Typography color="textSecondary">
              No saved backtests found
            </Typography>
          </Box>
        ) : (
          <Box display="flex" gap={2}>
            <Box flex={1} borderRight={1} borderColor="divider" pr={2}>
              <List>
                {backtests.map((backtest) => (
                  <ListItem
                    key={backtest.name}
                    button
                    selected={selectedBacktest?.name === backtest.name}
                    onClick={() => handleBacktestClick(backtest)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={backtest.name}
                      secondary={
                        <>
                          {backtest.config.symbol} - {formatMetric(backtest.metric.total_performance)}
                          <br />
                          {formatDate(backtest.created_at)}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box flex={1}>
              {selectedBacktest ? (
                <BacktestDetails backtest={selectedBacktest} />
              ) : (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  height="100%"
                >
                  <Typography color="textSecondary">
                    Select a backtest to view details
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MyBacktestsDialog;