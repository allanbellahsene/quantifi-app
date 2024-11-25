// components/LoadBacktestDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Divider,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const LoadBacktestDialog = ({ 
  open, 
  onClose, 
  onLoad,
  backtests 
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Load Backtest</DialogTitle>
      <DialogContent>
        <List>
          {backtests.map((backtest) => (
            <React.Fragment key={backtest.backtest_name}>
              <ListItem button onClick={() => onLoad(backtest)}>
                <ListItemText
                  primary={backtest.backtest_name}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {backtest.backtest_config.symbol} - {backtest.backtest_config.strategies.length} strategies
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2">
                        Performance: {(backtest.metrics.total_performance * 100).toFixed(2)}% | 
                        Sharpe: {backtest.metrics.sharpe_ratio.toFixed(2)} | 
                        Max DD: {(backtest.metrics.max_drawdown * 100).toFixed(2)}%
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(backtest.created_at).toLocaleDateString()}
                  </Typography>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoadBacktestDialog;