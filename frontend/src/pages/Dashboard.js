// Dashboard.js

import React, { useState } from 'react';
import axios from 'axios';
import { Select, DatePicker, InputNumber, Button, Space, message } from 'antd';
import StrategyBuilder from '../components/StrategyBuilder';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Dashboard = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [dateRange, setDateRange] = useState([]);
  const [strategy, setStrategy] = useState({ rules: [] });
  const [backtestResults, setBacktestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStrategyChange = (newRules) => {
    setStrategy({ ...strategy, rules: newRules });
  };

  const runBacktest = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/v1/backtest', {
        symbol,
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        strategy: {
          name: 'Custom Strategy',
          rules: strategy.rules,
        }
      });
      setBacktestResults(response.data);
      message.success('Backtest completed successfully');
    } catch (error) {
      console.error('Error running backtest:', error);
      if (error.response && error.response.data) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // Join array of error messages
          const messages = detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join(', ');
          message.error(`Backtest failed: ${messages}`);
        } else {
          message.error(`Backtest failed: ${detail}`);
        }
      } else if (error.request) {
        message.error('No response received from server. Please check your connection.');
      } else {
        message.error(`Error setting up the request: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>QuantiFi Dashboard</h1>
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        <Space>
          <Select
            value={symbol}
            onChange={setSymbol}
            style={{ width: 120 }}
          >
            <Option value="BTCUSDT">BTC/USDT</Option>
            <Option value="ETHUSDT">ETH/USDT</Option>
            {/* Add more trading pairs as needed */}
          </Select>
          <RangePicker onChange={setDateRange} />
        </Space>
        
        <StrategyBuilder onStrategyChange={handleStrategyChange} />
        
        <Button onClick={runBacktest} loading={loading} type="primary">
          Run Backtest
        </Button>

        {backtestResults && (
          <div>
            <h2>Backtest Results</h2>
            <p>Total Return: {(backtestResults.metrics.total_return * 100).toFixed(2)}%</p>
            <p>Sharpe Ratio: {backtestResults.metrics.sharpe_ratio.toFixed(2)}</p>
            <p>Max Drawdown: {(backtestResults.metrics.max_drawdown * 100).toFixed(2)}%</p>
            {/* You can add more detailed results or charts here */}
          </div>
        )}
      </Space>
    </div>
  );
};

export default Dashboard;