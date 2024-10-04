// Dashboard.js

import React, { useState } from 'react';
import axios from 'axios';
import { Select, DatePicker, InputNumber, Button, Space, message } from 'antd';
import StrategyBuilder from '../components/StrategyBuilder';

const { RangePicker } = DatePicker;

const Dashboard = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [dateRange, setDateRange] = useState([]);
  const [strategy, setStrategy] = useState({ rules: [] });
  const [backtestResults, setBacktestResults] = useState(null);

  const handleStrategyChange = (newRules) => {
    setStrategy({ ...strategy, rules: newRules });
  };
  
  const runBacktest = async () => {
    try {
      const requestData = {
        symbol,
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        strategy: {
          name: 'Custom Strategy',
          rules: strategy.rules,
        }
      };
      
      console.log('Sending backtest request:', JSON.stringify(requestData, null, 2));
      
      const response = await axios.post('http://localhost:8000/api/v1/backtest', requestData);
      
      console.log('Received backtest response:', JSON.stringify(response.data, null, 2));
      
      setBacktestResults(response.data);
      message.success('Backtest completed successfully');
    } catch (error) {
      console.error('Error running backtest:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        message.error(`Server error: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        message.error('No response received from server. Please check your connection.');
      } else {
        console.error('Error setting up request:', error.message);
        message.error(`Error setting up the request: ${error.message}`);
      }
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-pink-500">QuantiFi Backtest Dashboard</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 text-pink-500">Backtest Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cryptocurrency</label>
                <Select
                  value={symbol}
                  onChange={setSymbol}
                  className="w-full"
                  dropdownClassName="bg-gray-700"
                >
                  <Select.Option value="BTCUSDT">Bitcoin (BTC/USDT)</Select.Option>
                  <Select.Option value="ETHUSDT">Ethereum (ETH/USDT)</Select.Option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date Range</label>
                <RangePicker
                  onChange={setDateRange}
                  className="w-full bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contract Type</label>
                <Select
                  defaultValue="spot"
                  className="w-full"
                  dropdownClassName="bg-gray-700"
                >
                  <Select.Option value="spot">Spot</Select.Option>
                  <Select.Option value="futures">Futures</Select.Option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Frequency</label>
                <Select
                  defaultValue="1d"
                  className="w-full"
                  dropdownClassName="bg-gray-700"
                >
                  <Select.Option value="1d">1d</Select.Option>
                  <Select.Option value="4h">4h</Select.Option>
                  <Select.Option value="1h">1h</Select.Option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fee (%)</label>
                <InputNumber
                  defaultValue={0.1}
                  min={0}
                  max={100}
                  step={0.01}
                  className="w-full bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slippage (%)</label>
                <InputNumber
                  defaultValue={0.05}
                  min={0}
                  max={100}
                  step={0.01}
                  className="w-full bg-gray-700 border-gray-600"
                />
              </div>
            </div>
            <div className="mt-6">
              <StrategyBuilder onStrategyChange={handleStrategyChange} />
            </div>
            <Button
              onClick={runBacktest}
              className="mt-6 w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
            >
              Run Backtest
            </Button>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 text-pink-500">Backtest Results</h2>
            {backtestResults ? (
              <div>
                {/* Add your backtest results visualization here */}
                <p>Results will be displayed here after running a backtest.</p>
              </div>
            ) : (
              <p className="text-gray-400">Run a backtest to see results</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;