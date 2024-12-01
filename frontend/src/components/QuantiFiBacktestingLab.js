//QuantiFiBacktestingLab.js

import React, { useState, useEffect } from 'react';
import {
  Button, 
  Typography,
  Box
} from '@mui/material';
import axios from 'axios';
import MetricsTable from './MetricsTable';
import { styled } from '@mui/material/styles';
import BacktestingParameters from './BacktestingParameters';
import StrategyBuilder from './StrategyBuilder';
import TradesTable from './TradesTable';
import ChartSystem from './ChartSystem';
import TradeReturnsHistogram from './TradesHistogram';
import SaveBacktestDialog from './SaveBacktestDialog';
import MyBacktestsDialog from './MyBacktestsDialog';
import { BASE_URL } from './config';


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
  { name: 'Average_Move_From_Open', params: ['window'] },
];


const indicatorTemplate = {
  type: 'simple',   // 'simple' or 'composite'
  name: '',         // Name of the indicator (for simple indicators)
  params: {},       // Parameters for the indicator (for simple indicators)
  expression: '',   // Expression for composite indicators
  function: '',     // Function name (for composite indicators)
  indicators: [],   // Array of Indicators (for composite indicators)
};

const QuantiFiBacktestingLab = ({ accessToken }) => {
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
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isMyBacktestsOpen, setIsMyBacktestsOpen] = useState(false);

  const handleSaveBacktest = async (backtestData) => {
    try {
      const response = axios.post(
        `${BASE_URL}/api/backtest/save`,
        backtestData,
        {headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      //if (!response.ok) {
      //  const error = await response.json();
      //  throw new Error(error.detail || 'Failed to save backtest');
      //}

      setIsSaveDialogOpen(false);
      // You might want to show a success notification here
    } catch (err) {
      setSaveError(err.message);
      throw err;
    }
  };

  const handleLoadBacktest = async (backtest) => {
    try {
      setAsset(backtest.backtest_config.symbol);
      setDataSource(backtest.backtest_config.data_source);
      setStartDate(backtest.backtest_config.start);
      setEndDate(backtest.backtest_config.end);
      setFees(backtest.backtest_config.fees);
      setSlippage(backtest.backtest_config.slippage);
      setStrategies(backtest.backtest_config.strategies);

      // Automatically run the backtest
      await runBacktest();
    } catch (err) {
      setError('Failed to load backtest: ' + err.message);
    }
  };

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
      position_size: 1,
      regime_filter: null,
      position_size_method: 'fixed',
      fixed_position_size: 1.0,
      volatility_target: null,
      volatility_lookback: 30,
      volatility_buffer: null,
      max_leverage: 1.0,
      frequency: defaultFrequency,
      collapsed: false,
      entryRulesCollapsed: false,
      exitRulesCollapsed: false,
    }]);
  };

  const deleteStrategy = (indexToDelete) => {
    setStrategies(strategies.filter((_, index) => index !== indexToDelete));
  };

  const updateStrategy = (index, field, value) => {
    const updatedStrategies = [...strategies];
    updatedStrategies[index][field] = value;
  
    if (field === 'position_size_method') {
      if (value === 'fixed') {
        updatedStrategies[index]['volatility_target'] = null;
        updatedStrategies[index]['volatility_buffer'] = null;
        updatedStrategies[index]['volatility_lookback'] = 30;
        updatedStrategies[index]['max_leverage'] = 1.0;
        if (!updatedStrategies[index]['fixed_position_size']) {
          updatedStrategies[index]['fixed_position_size'] = 1.0;
        }
      } else if (value === 'volatility_target') {
        updatedStrategies[index]['fixed_position_size'] = null;
        if (!updatedStrategies[index]['volatility_target']) {
          updatedStrategies[index]['volatility_target'] = 10.0;
        }
        if (!updatedStrategies[index]['volatility_buffer']) {
          updatedStrategies[index]['volatility_buffer'] = 5.0;
        }
        if (!updatedStrategies[index]['volatility_lookback']) {
          updatedStrategies[index]['volatility_lookback'] = 30;
        }
        if (!updatedStrategies[index]['max_leverage']) {
          updatedStrategies[index]['max_leverage'] = 3.0;
        }
      }
    }
  
    if (field === 'frequency') {
      const selectedFrequency = value;
      const availableFrequencies = dataSource === 'Yahoo Finance'
        ? ['Daily']
        : ['Daily', '4h', '1h', '30m', '15m', '10m', '5m', '1m'];
  
      if (!availableFrequencies.includes(selectedFrequency)) {
        updatedStrategies[index]['frequency'] = availableFrequencies[0];
      }
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
      rule.leftIndicator.params = {};
    } else if (field === 'rightIndicatorName') {
      rule.rightIndicator.name = value;
      rule.rightIndicator.params = {};
    } else if (field === 'leftIndicatorExpression') {
      rule.leftIndicator.expression = value;
    } else if (field === 'rightIndicatorExpression') {
      rule.rightIndicator.expression = value;
    } else if (field === 'useRightIndicator') {
      rule.useRightIndicator = value;
      if (!value) {
        rule.rightIndicator = { ...indicatorTemplate };
        rule.rightValue = '';
      } else {
        if (!rule.rightIndicator) {
          rule.rightIndicator = { ...indicatorTemplate };
        }
      }
    } else if (field === 'rightValue') {
      rule.rightValue = value;
    } else {
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

  const duplicateStrategy = (strategyIndex) => {
    const strategyToDuplicate = strategies[strategyIndex];
    const duplicatedStrategy = JSON.parse(JSON.stringify(strategyToDuplicate));

    const originalName = duplicatedStrategy.name;
    const copyRegex = / Copy( \d+)?$/;
    let baseName = originalName.replace(copyRegex, '');
    let copyNumber = 1;

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
    duplicatedStrategy.collapsed = false;

    setStrategies([...strategies, duplicatedStrategy]);
  };

  const runBacktest = async () => {
    setIsLoading(true);
    setError(null);
  
    try {
      const processIndicator = (indicator) => ({
        type: indicator.type,
        name: indicator.name,
        params: indicator.params,
        expression: indicator.expression,
      });
  
      const processRules = (rules) => rules.map((rule) => ({
        operator: rule.operator,
        useRightIndicator: rule.useRightIndicator,
        rightValue: rule.rightValue,
        logicalOperator: rule.logicalOperator,
        leftIndicator: processIndicator(rule.leftIndicator),
        rightIndicator: rule.useRightIndicator ? processIndicator(rule.rightIndicator) : null,
      }));
  
      const strategiesToSend = strategies.map((strategy) => {
        const strategyData = {
          name: strategy.name,
          allocation: strategy.allocation,
          entryRules: processRules(strategy.entryRules),
          exitRules: processRules(strategy.exitRules),
          positionType: strategy.positionType,
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

      const response = await fetch(`${BASE_URL}/api/backtest`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
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
      setBacktestResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">QuantiFi Backtesting Lab</Typography>
        <Button
          variant="outlined"
          onClick={() => setIsMyBacktestsOpen(true)}
        >
          My Backtests
        </Button>
      </Box>

      {/* Main content */}
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

      {/* Buttons section */}
      <div className="flex gap-2 mt-4">
        <PrimaryButton onClick={runBacktest} disabled={isLoading}>
          {isLoading ? 'Running Backtest...' : 'Run Backtest'}
        </PrimaryButton>

        {backtestResults && (
          <PrimaryButton 
            onClick={() => setIsSaveDialogOpen(true)}
            disabled={isLoading}
          >
            Save Backtest
          </PrimaryButton>
        )}
      </div>

      {/* Error message */}
      {error && (
        <Typography color="error" className="mt-4">{error}</Typography>
      )}

      {/* Results section */}
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

      {/* Dialogs */}
      <SaveBacktestDialog
        open={isSaveDialogOpen}
        onClose={() => {
          setIsSaveDialogOpen(false);
          setSaveError(null);
        }}
        backtestConfig={{
          symbol: asset,
          dataSource: dataSource,
          startDate: startDate,
          endDate: endDate,
          fees: fees,
          slippage: slippage,
          strategies: strategies,
        }}
        backtestResults={backtestResults}
        onSave={handleSaveBacktest}
      />

      <MyBacktestsDialog
        open={isMyBacktestsOpen}
        onClose={() => setIsMyBacktestsOpen(false)}
        accessToken={accessToken}
        onLoadBacktest={handleLoadBacktest}
      />
    </div>
  );
};

export default QuantiFiBacktestingLab;