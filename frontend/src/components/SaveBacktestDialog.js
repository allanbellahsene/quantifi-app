import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from '@mui/material';

const SaveBacktestDialog = ({ 
  open, 
  onClose, 
  backtestConfig, 
  backtestResults,
  onSave 
}) => {
  const [backtestName, setBacktestName] = useState('');
  const [error, setError] = useState(null);

  const handleSave = async () => {
    try {
      if (!backtestName.trim()) {
        setError('Backtest name is required');
        return;
      }

      // Log the full backtest results for debugging
      console.log('Full backtest results:', backtestResults);

      // Extract metrics from the Portfolio section
      const portfolioMetrics = backtestResults.metrics?.Portfolio || {};
      
      // Calculate the metrics based on the actual structure
      const metrics = {
        total_performance: parseFloat(portfolioMetrics.Total_Return || portfolioMetrics['Total Return'] || 0),
        sharpe_ratio: parseFloat(portfolioMetrics.Sharpe_Ratio || portfolioMetrics['Sharpe Ratio'] || 0),
        max_drawdown: parseFloat(portfolioMetrics.Max_Drawdown || portfolioMetrics['Max Drawdown'] || 0)
      };

      // Log the extracted metrics for debugging
      console.log('Extracted metrics:', metrics);

      const backtestData = {
        backtest_name: backtestName,
        backtest_config: {
          symbol: backtestConfig.symbol,
          data_source: backtestConfig.dataSource,
          start: backtestConfig.startDate,
          end: backtestConfig.endDate,
          fees: backtestConfig.fees,
          slippage: backtestConfig.slippage,
          strategies: backtestConfig.strategies,
        },
        metrics: {
          total_performance: parseFloat(backtestResults.metrics?.Portfolio?.['Total Return'] || 0),
          sharpe_ratio: parseFloat(backtestResults.metrics?.Portfolio?.['Sharpe Ratio'] || 0),
          max_drawdown: parseFloat(backtestResults.metrics?.Portfolio?.['Max Drawdown'] || 0)
        }
      };

      // Debug log to verify the data being sent
      console.log('Saving backtest with data:', backtestData);

      await onSave(backtestData);
      setBacktestName('');
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Save Backtest</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          label="Backtest Name"
          fullWidth
          value={backtestName}
          onChange={(e) => setBacktestName(e.target.value)}
          placeholder="Enter a name for your backtest"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveBacktestDialog;