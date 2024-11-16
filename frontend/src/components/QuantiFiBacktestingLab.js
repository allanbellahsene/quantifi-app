//QuantiFiBacktestingLab.js

import React, { useState, useEffect } from 'react';
import {
  Button, 
  Typography} from '@mui/material';
import MetricsTable from './MetricsTable';
import { styled } from '@mui/material/styles';
import BacktestingParameters from './BacktestingParameters';
import StrategyBuilder from './StrategyBuilder';
import TradesTable from './TradesTable';
import TradeReturnsHistogram from './TradesHistogram';
import ChartSystem from './ChartSystem';

const FEATURE_FLAGS = {
  SHOW_TRADE_ANALYSIS: false,  // Set to false to disable trade analysis
};


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
  { name: 'SMA', params: ['series', 'window'] },
  { name: 'EMA', params: ['series', 'window'] },
  { name: 'Rolling_High', params: ['series', 'window'] },
  { name: 'Rolling_Low', params: ['series', 'window'] },
  { name: 'MA_trend', params: ['series', 'ma_window', 'return_window'] },
  { name: 'VWAP', params: [] },
];


const indicatorTemplate = {
  type: 'simple',   // 'simple' or 'composite'
  name: '',         // Name of the indicator (for simple indicators)
  params: {},       // Parameters for the indicator (for simple indicators)
  expression: '',   // Expression for composite indicators
  function: '',     // Function name (for composite indicators)
  indicators: [],   // Array of Indicators (for composite indicators)
};



const QuantiFiBacktestingLab = () => {
  const [asset, setAsset] = useState('BTC-USD');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2024-10-09');
  const [fees, setFees] = useState(0.5);
  const [slippage, setSlippage] = useState(0.1);
  const [strategies, setStrategies] = useState([]);
  const [backtestResults, setBacktestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('Yahoo Finance');

  

  useEffect(() => {
    console.log('Strategies updated:', strategies);
  }, [strategies]);

  const toggleStrategyCollapse = (strategyIndex) => {
    const updatedStrategies = [...strategies];
    updatedStrategies[strategyIndex].collapsed = !updatedStrategies[strategyIndex].collapsed;
    setStrategies(updatedStrategies);
  };
  
  const addStrategy = () => {
    const defaultFrequency = dataSource === 'Yahoo Finance' ? 'Daily' : '1h';
    setStrategies([...strategies, {
      name: `Strategy ${strategies.length + 1}`,
      allocation: 100,
      positionType: 'long',
      entryRules: [],
      exitRules: [],
      active: true,
      entryRegimeRules: [],  // Separate rules for entry regime
      exitRegimeRules: [],   // Separate rules for exit regime
      regimeEntryAction: null,
      regimeExitAction: null,
      regimeAsset: '',
      position_size_method: 'fixed',
      fixed_position_size: 1.0,
      volatility_target: null,
      volatility_lookback: 30,
      volatility_buffer: null,
      max_leverage: 1.0,
      frequency: defaultFrequency,
      collapsed: false,
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
  
    // Add logic to handle updates to the 'frequency' field
    if (field === 'frequency') {
      const selectedFrequency = value;
      const availableFrequencies = dataSource === 'Yahoo Finance'
        ? ['Daily']
        : ['Daily', '4h', '1h', '30m', '15m', '10m', '5m', '1m'];
  
      // Validate that the selected frequency is available for the current data source
      if (!availableFrequencies.includes(selectedFrequency)) {
        // If not valid, reset to a default frequency
        updatedStrategies[index]['frequency'] = availableFrequencies[0];
      }
  
      // Reset or adjust any dependent fields if necessary
      // For example, you might want to reset indicators that are not compatible with the new frequency
      // updatedStrategies[index]['entryRules'] = []; // Optionally reset entry rules
      // updatedStrategies[index]['exitRules'] = []; // Optionally reset exit rules
    }
  
    setStrategies(updatedStrategies);
  };
  
  

  const addRule = (strategyIndex, ruleType) => {
    const updatedStrategies = [...strategies];
    const newRule = {
      leftIndicator: { ...indicatorTemplate },
      operator: '<',
      useRightIndicator: false,
      rightIndicator: { ...indicatorTemplate },
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
    const updatedStrategies = [...strategies];
    const rule = updatedStrategies[strategyIndex][ruleType][ruleIndex];
  
    if (field === 'leftIndicatorType') {
      rule.leftIndicator.type = value;
      if (value === 'simple') {
        rule.leftIndicator.expression = '';
        rule.leftIndicator.name = '';
        rule.leftIndicator.params = {};
      } else if (value === 'composite') {
        rule.leftIndicator.name = '';
        rule.leftIndicator.params = {};
        // Do not reset 'expression' to preserve user input
        if (!rule.leftIndicator.expression) {
          rule.leftIndicator.expression = '';
        }
      }
    } else if (field === 'rightIndicatorType') {
      rule.rightIndicator.type = value;
      if (value === 'simple') {
        rule.rightIndicator.expression = '';
        rule.rightIndicator.name = '';
        rule.rightIndicator.params = {};
      } else if (value === 'composite') {
        rule.rightIndicator.name = '';
        rule.rightIndicator.params = {};
        if (!rule.rightIndicator.expression) {
          rule.rightIndicator.expression = '';
        }
      }
    } else if (field === 'leftIndicatorName') {
      rule.leftIndicator.name = value;
      // Reset params when the indicator name changes
      rule.leftIndicator.params = {};
    } else if (field === 'rightIndicatorName') {
      rule.rightIndicator.name = value;
      // Reset params when the indicator name changes
      rule.rightIndicator.params = {};
    } else if (field === 'leftIndicatorExpression') {
      rule.leftIndicator.expression = value;
    } else if (field === 'rightIndicatorExpression') {
      rule.rightIndicator.expression = value;
    } else if (field === 'useRightIndicator') {
      rule.useRightIndicator = value;
      if (!value) {
        // If not using a right indicator, reset the right indicator fields
        rule.rightIndicator = { ...indicatorTemplate };
        rule.rightValue = '';
      } else {
        // If using a right indicator, ensure it's initialized
        if (!rule.rightIndicator) {
          rule.rightIndicator = { ...indicatorTemplate };
        }
      }
    } else if (field === 'rightValue') {
      rule.rightValue = value;
    } else {
      // For other fields like 'operator' and 'logicalOperator'
      rule[field] = value;
    }
    setStrategies(updatedStrategies);
  };
  
  

  const updateIndicatorParam = (strategyIndex, ruleIndex, ruleType, side, param, value) => {
    const updatedStrategies = [...strategies];
    const rule = updatedStrategies[strategyIndex][ruleType][ruleIndex];
    if (!rule[`${side}Indicator`].params) {
      rule[`${side}Indicator`].params = {};
    }
    // Default 'series' parameter to 'Close' if empty
    if (param === 'series' && !value) {
      rule[`${side}Indicator`].params[param] = 'Close';
    } else {
      rule[`${side}Indicator`].params[param] = value;
    }
    setStrategies(updatedStrategies);
  };
  
  

  const removeRule = (strategyIndex, ruleIndex, ruleType) => {
    const updatedStrategies = [...strategies];
    updatedStrategies[strategyIndex][ruleType].splice(ruleIndex, 1);
    setStrategies(updatedStrategies);
  };

  // **Function to Duplicate a Strategy**
  const duplicateStrategy = (strategyIndex) => {
    const strategyToDuplicate = strategies[strategyIndex];
    // Create a deep copy of the strategy
    const duplicatedStrategy = JSON.parse(JSON.stringify(strategyToDuplicate));

    // Modify the name to indicate it's a copy
    const originalName = duplicatedStrategy.name;
    const copyRegex = / Copy( \d+)?$/;
    let baseName = originalName.replace(copyRegex, '');
    let copyNumber = 1;

    // Check if any existing strategies have the same base name with a copy number
    strategies.forEach((strategy) => {
      const match = strategy.name.match(new RegExp(`^${baseName} Copy( \\d+)?$`));
      if (match) {
        const number = match[1] ? parseInt(match[1].trim()) : 1;
        if (number >= copyNumber) {
          copyNumber = number + 1;
        }
      }
    });

    duplicatedStrategy.name = `${baseName} Copy${copyNumber > 1 ? ' ' + copyNumber : ''}`;
    duplicatedStrategy.collapsed = false; // Expand the duplicated strategy

    // Add the duplicated strategy to the strategies array
    setStrategies([...strategies, duplicatedStrategy]);
  };
  
  const runBacktest = async () => {
    setIsLoading(true);
    setError(null);
  
    try {
      // Function to process indicators
      const processIndicator = (indicator) => {
        return {
          type: indicator.type,
          name: indicator.name,
          params: indicator.params, // Keep params as a dictionary
          expression: indicator.expression,
        };
      };
  
      // Function to process rules
      const processRules = (rules) => {
        return rules.map((rule) => ({
          operator: rule.operator,
          useRightIndicator: rule.useRightIndicator,
          rightValue: rule.rightValue,
          logicalOperator: rule.logicalOperator,
          leftIndicator: processIndicator(rule.leftIndicator),
          rightIndicator: rule.useRightIndicator ? processIndicator(rule.rightIndicator) : null,
        }));
      };
  
      // Prepare strategies data
      const strategiesToSend = strategies.map((strategy) => {
        const strategyData = {
          name: strategy.name,
          allocation: strategy.allocation,
          positionType: strategy.positionType,
          entryRules: processRules(strategy.entryRules),
          exitRules: processRules(strategy.exitRules),
          entryRegimeRules: processRules(strategy.entryRegimeRules),  // Make sure these are included
          exitRegimeRules: processRules(strategy.exitRegimeRules),    // Make sure these are included
          regimeEntryAction: strategy.regimeEntryAction,
          regimeExitAction: strategy.regimeExitAction,
          regimeAsset: strategy.regimeAsset,
          active: strategy.active,
          position_size_method: strategy.position_size_method,
          max_leverage: strategy.max_leverage,
          frequency: strategy.frequency,
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
  
      // Log the payload for debugging
      console.log('Backtest request payload:', {
        symbol: asset,
        data_source: dataSource,
        start: startDate,
        end: endDate,
        fees,
        slippage,
        strategies: strategiesToSend,
      });
  
      const response = await fetch('http://localhost:8002/api/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: asset,
          data_source: dataSource,
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
      console.log('Trades data:', data.trades);
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
        dataSource={dataSource}
        setDataSource={setDataSource}
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
        duplicateStrategy={duplicateStrategy}
        dataSource={dataSource}
      />

      <PrimaryButton 
        onClick={runBacktest} 
        disabled={isLoading} 
        sx={{ mt: 4 }}
      >
        {isLoading ? 'Running Backtest...' : 'Run Backtest'}
      </PrimaryButton>

      {error && (
        <Typography color="error" className="mt-4">
          {error}
        </Typography>
      )}

      {/* Results Section */}
      {backtestResults && (
        <div>
          <ChartSystem
            equityCurveData={backtestResults.equityCurve || []}
            drawdownData={backtestResults.drawdown || []}
            rollingSharpeData={backtestResults.rollingSharpe || []}
            signals={backtestResults.signals || {}}
            strategies={strategies.filter(s => s.active)}
            assetName={asset}
            startDate={startDate}
            endDate={endDate}
          />
          
          {backtestResults.metrics && (
            <MetricsTable metrics={backtestResults.metrics} />
          )}
          
          {backtestResults?.trades && backtestResults.trades.length > 0 && (
            <>
              <TradesTable trades={backtestResults.trades} />
              <TradeReturnsHistogram trades={backtestResults.trades} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default QuantiFiBacktestingLab;