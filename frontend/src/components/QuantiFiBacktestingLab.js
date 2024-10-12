//QuantiFiBacktestingLab.js

import React, { useState, useEffect } from 'react';
import {
  Button, 
  Typography} from '@mui/material';
import dayjs from 'dayjs';
import EquityCurveChart from './EquityCurveChart';
import MetricsTable from './MetricsTable';
import DrawdownChart from './DrawdownChart';
import RollingSharpeChart from './RollingSharpeChart';
import { styled } from '@mui/material/styles';
import BacktestingParameters from './BacktestingParameters';
import StrategyBuilder from './StrategyBuilder';



// Create a PrimaryButton component
const PrimaryButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
  borderRadius: 12,
  color: 'white',
  padding: '10px 24px',
  fontSize: '16px',
  textTransform: 'none',
  boxShadow: '0 3px 5px 2px rgba(78, 205, 196, .3)',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));


const INDICATORS = [
  { name: 'Open', params: [] },
  { name: 'High', params: [] },
  { name: 'Low', params: [] },
  { name: 'Close', params: [] },
  { name: 'Volume', params: [] },
  { name: 'SMA', params: ['series', 'period'] },
  { name: 'EMA', params: ['series', 'period'] },
  { name: 'Rolling_High', params: ['series', 'period'] },
  { name: 'Rolling_Low', params: ['series', 'period'] },
  { name: 'MA_trend', params: ['series', 'ma_window', 'return_window'] },
];

const QuantiFiBacktestingLab = () => {
  const [asset, setAsset] = useState('BTC-USD');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2024-10-09');
  const [fees, setFees] = useState(0.001);
  const [slippage, setSlippage] = useState(0.001);
  const [strategies, setStrategies] = useState([]);
  const [backtestResults, setBacktestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  

  useEffect(() => {
    if (backtestResults) {
      if (backtestResults.equityCurve) {
        const processedEquityCurve = backtestResults.equityCurve.map(item => ({
          ...item,
          Date: dayjs(item.Date).format('YYYY-MM-DD')
        }));
        setBacktestResults(prev => ({ ...prev, equityCurve: processedEquityCurve }));
      }
      if (backtestResults.drawdown) {
        const processedDrawdown = backtestResults.drawdown.map(item => ({
          ...item,
          Date: dayjs(item.Date).format('YYYY-MM-DD')
        }));
        setBacktestResults(prev => ({ ...prev, drawdown: processedDrawdown }));
      }
      if (backtestResults.rollingSharpe) {
        const processedRollingSharpe = backtestResults.rollingSharpe.map(item => ({
          ...item,
          Date: dayjs(item.Date).format('YYYY-MM-DD')
        }));
        setBacktestResults(prev => ({ ...prev, rollingSharpe: processedRollingSharpe }));
      }
    }
  }, [backtestResults]);

  useEffect(() => {
    console.log('Strategies updated:', strategies);
  }, [strategies]);

  const toggleStrategyCollapse = (strategyIndex) => {
    const updatedStrategies = [...strategies];
    updatedStrategies[strategyIndex].collapsed = !updatedStrategies[strategyIndex].collapsed;
    setStrategies(updatedStrategies);
  };
  
  const addStrategy = () => {
    setStrategies([...strategies, {
      name: `Strategy ${strategies.length + 1}`,
      allocation: 100,
      positionType: 'long',
      entryRules: [],
      exitRules: [],
      active: true,
      position_size: 1,
      regime_filter: null,
      position_size_method: 'fixed', // New parameter
      fixed_position_size: 1.0,      // New parameter
      volatility_target: null,       // New parameter
      volatility_lookback: 30,       // New parameter
      volatility_buffer: null,       // New parameter
      max_leverage: 1.0, 
      collapsed: false, // New property to track collapse state
    }]);
  };

  const deleteStrategy = (indexToDelete) => {
    setStrategies(strategies.filter((_, index) => index !== indexToDelete));
  };

  const updateStrategy = (index, field, value) => {
    const updatedStrategies = [...strategies];
    updatedStrategies[index][field] = value;

    // Additional logic to reset fields if necessary
    if (field === 'position_size_method') {
      if (value === 'fixed') {
        // Reset volatility-related fields
        updatedStrategies[index]['volatility_target'] = null;
        updatedStrategies[index]['volatility_buffer'] = null;
        updatedStrategies[index]['volatility_lookback'] = 30;
        updatedStrategies[index]['max_leverage'] = 1.0;
        // Ensure fixed_position_size has a default value
        if (!updatedStrategies[index]['fixed_position_size']) {
          updatedStrategies[index]['fixed_position_size'] = 1.0;
        }
      } else if (value === 'volatility_target') {
        // Reset fixed_position_size
        updatedStrategies[index]['fixed_position_size'] = null;
        // Ensure volatility-related fields have default values
        if (!updatedStrategies[index]['volatility_target']) {
          updatedStrategies[index]['volatility_target'] = 10.0; // Example default
        }
        if (!updatedStrategies[index]['volatility_buffer']) {
          updatedStrategies[index]['volatility_buffer'] = 5.0; // Example default
        }
        if (!updatedStrategies[index]['volatility_lookback']) {
          updatedStrategies[index]['volatility_lookback'] = 30;
        }
        if (!updatedStrategies[index]['max_leverage']) {
          updatedStrategies[index]['max_leverage'] = 3.0;
        }
      }
    }

    setStrategies(updatedStrategies);
  };

  const addRule = (strategyIndex, ruleType) => {
    const updatedStrategies = [...strategies];
    const newRule = {
      leftIndicator: '',
      leftParams: { series: 'Close' }, // Set default 'series' parameter
      operator: '<',
      useRightIndicator: false,
      rightIndicator: '',
      rightParams: { series: 'Close' }, // Set default 'series' parameter
      rightValue: '',
      logicalOperator: 'and',
    };
    if (!updatedStrategies[strategyIndex][ruleType]) {
      updatedStrategies[strategyIndex][ruleType] = [];
    }
    updatedStrategies[strategyIndex][ruleType].push(newRule);
    setStrategies(updatedStrategies);
  };
  

  const updateRule = (strategyIndex, ruleIndex, ruleType, field, value) => {
    console.log('Updating rule:', { strategyIndex, ruleIndex, ruleType, field, value });
    const updatedStrategies = [...strategies];
    if (field === 'leftIndicator' || field === 'rightIndicator') {
      const indicator = INDICATORS.find(i => i.name === value);
      updatedStrategies[strategyIndex][ruleType][ruleIndex][field] = value;
      updatedStrategies[strategyIndex][ruleType][ruleIndex][field === 'leftIndicator' ? 'leftParams' : 'rightParams'] = 
        indicator ? indicator.params.reduce((acc, param) => ({ ...acc, [param]: '' }), {}) : {};
    } else if (field === 'useRightIndicator') {
      updatedStrategies[strategyIndex][ruleType][ruleIndex].useRightIndicator = value;
      if (!value) {
        updatedStrategies[strategyIndex][ruleType][ruleIndex].rightValue = '';
      } else {
        updatedStrategies[strategyIndex][ruleType][ruleIndex].rightIndicator = '';
        updatedStrategies[strategyIndex][ruleType][ruleIndex].rightParams = {};
      }
    } else if (field === 'rightValue') {
      updatedStrategies[strategyIndex][ruleType][ruleIndex].rightValue = value;
    } else {
      updatedStrategies[strategyIndex][ruleType][ruleIndex][field] = value;
    }
    setStrategies(updatedStrategies);
  };

  const updateIndicatorParam = (strategyIndex, ruleIndex, ruleType, side, param, value) => {
    const updatedStrategies = [...strategies];
    updatedStrategies[strategyIndex][ruleType][ruleIndex][`${side}Params`][param] = value || 'Close'; // Default to 'Close' if empty
    setStrategies(updatedStrategies);
  };
  

  const removeRule = (strategyIndex, ruleIndex, ruleType) => {
    const updatedStrategies = [...strategies];
    updatedStrategies[strategyIndex][ruleType].splice(ruleIndex, 1);
    setStrategies(updatedStrategies);
  };
  
  const runBacktest = async () => {
    setIsLoading(true);
    setError(null);

    try {
        // Prepare strategies data
        const strategiesToSend = strategies.map((strategy) => {
          const strategyData = {
            name: strategy.name,
            allocation: strategy.allocation,
            entryRules: strategy.entryRules,
            exitRules: strategy.exitRules,
            positionType: strategy.positionType,
            active: strategy.active,
            position_size_method: strategy.position_size_method,
            max_leverage: strategy.max_leverage,
          };
        
          if (strategy.position_size_method === 'fixed') {
            strategyData.fixed_position_size = strategy.fixed_position_size;
          } else if (strategy.position_size_method === 'volatility_target') {
            strategyData.volatility_target = strategy.volatility_target;
            strategyData.volatility_buffer = strategy.volatility_buffer;
            strategyData.volatility_lookback = strategy.volatility_lookback;
          }
        
          return strategyData;
        });
        

      // Log the payload
      console.log('Backtest request payload:', {
        symbol: asset,
        start: startDate,
        end: endDate,
        fees,
        slippage,
        strategies: strategiesToSend,
      });

      const response = await fetch('http://localhost:8001/api/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: asset,
          start: startDate,
          end: endDate,
          fees,
          slippage,
          strategies: strategiesToSend,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to run backtest');
      }

      const data = await response.json();
      console.log('Backtest API response:', data);
      setBacktestResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">QuantiFi Backtesting Lab</h1>

      <BacktestingParameters
        asset={asset}
        setAsset={setAsset}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        fees={fees}
        setFees={setFees}
        slippage={slippage}
        setSlippage={setSlippage}
      />

      <StrategyBuilder
        strategies={strategies}
        setStrategies={setStrategies}
        INDICATORS={INDICATORS}
        updateStrategy={updateStrategy}
        addStrategy={addStrategy}
        deleteStrategy={deleteStrategy}
        updateRule={updateRule}
        updateIndicatorParam={updateIndicatorParam}
        removeRule={removeRule}
        addRule={addRule}
        toggleStrategyCollapse={toggleStrategyCollapse}
      />


      <PrimaryButton onClick={runBacktest} disabled={isLoading} sx={{ mt: 4 }}>
        {isLoading ? 'Running Backtest...' : 'Run Backtest'}
      </PrimaryButton>

      {error && (
        <Typography color="error" className="mt-4">{error}</Typography>
      )}

      {backtestResults && (
        <div>
          <EquityCurveChart 
            data={backtestResults.equityCurve} 
            strategies={strategies.filter(s => s.active)}
            assetName={asset}
            startDate={startDate}
            endDate={endDate}
          />
          <DrawdownChart
            data={backtestResults.drawdown}
            strategies={strategies.filter(s => s.active)}
            assetName={asset}
            startDate={startDate}
            endDate={endDate}
            />
          <RollingSharpeChart
            data={backtestResults.rollingSharpe}
            strategies={strategies.filter(s => s.active)}
            assetName={asset}
            startDate={startDate}
            endDate={endDate}
          />
        {backtestResults.metrics && (
            <MetricsTable metrics={backtestResults.metrics} />
            )}
            </div>
        )}
    </div>
  );
};

export default QuantiFiBacktestingLab;