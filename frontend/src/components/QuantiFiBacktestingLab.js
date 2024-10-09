import React, { useState, useEffect } from 'react';
import { Card, CardContent, TextField, Button, Select, MenuItem, FormControl, InputLabel, IconButton, Typography, Box, Switch, FormControlLabel } from '@mui/material';
import { DatePicker } from 'antd';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import EquityCurveChart from './EquityCurveChart';
import MetricsTable from './MetricsTable';
import DrawdownChart from './DrawdownChart';
import RollingSharpeChart from './RollingSharpeChart';

const INDICATORS = [
  { name: 'Open', params: [] },
  { name: 'High', params: [] },
  { name: 'Low', params: [] },
  { name: 'Close', params: [] },
  { name: 'Volume', params: [] },
  { name: 'SMA', params: ['period'] },
  { name: 'EMA', params: ['period'] },
  { name: 'Rolling_High', params: ['period'] },
  { name: 'Rolling_Low', params: ['period'] },
  { name: 'MA_trend', params: ['ma_window', 'return_window'] },
];

//const COMPARISON_OPERATORS = ['<', '<=', '>', '>=', '==', '!='];
//const LOGICAL_OPERATORS = ['and', 'or'];

const QuantiFiBacktestingLab = () => {
  const [asset, setAsset] = useState('BTC-USD');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [fees, setFees] = useState(0.001);
  const [slippage, setSlippage] = useState(0.001);
  const [strategies, setStrategies] = useState([]);
  const [backtestResults, setBacktestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartDateChange = (date) => {
    if (date) {
      setStartDate(date.format('YYYY-MM-DD'));
    }
  };

  const handleEndDateChange = (date) => {
    if (date) {
      setEndDate(date.format('YYYY-MM-DD'));
    }
  };

  //useEffect(() => {
   // if (backtestResults && backtestResults.equityCurve) {
    //  const processedData = backtestResults.equityCurve.map(item => ({
     //   ...item,
      //  date: dayjs(item.date).format('YYYY-MM-DD')
 //     }));
  //    console.log('Processed data:', processedData);
//      console.log('Date range:', processedData[0].date, 'to', processedData[processedData.length - 1].date);
//      setBacktestResults(prev => ({ ...prev, equityCurve: processedData }));
//    }
//  }, [backtestResults]);

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
  
  const addStrategy = () => {
    setStrategies([...strategies, {
      name: `Strategy ${strategies.length + 1}`,
      allocation: 100,
      positionType: 'long',
      entryRules: [],
      exitRules: [],
      active: true,
      position_size: 1,
      regime_filter: null
    }]);
  };

  const deleteStrategy = (indexToDelete) => {
    setStrategies(strategies.filter((_, index) => index !== indexToDelete));
  };

  const updateStrategy = (index, field, value) => {
    const updatedStrategies = [...strategies];
    updatedStrategies[index][field] = value;
    setStrategies(updatedStrategies);
  };

  const addRule = (strategyIndex, ruleType) => {
    const updatedStrategies = [...strategies];
    const newRule = {
      leftIndicator: '',
      leftParams: {},
      operator: '<',
      useRightIndicator: false,
      rightIndicator: '',
      rightParams: {},
      rightValue: '',
      logicalOperator: 'and'
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
    updatedStrategies[strategyIndex][ruleType][ruleIndex][`${side}Params`][param] = value;
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
          strategies
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

      <Card className="mb-4">
        <CardContent>
          <TextField label="Asset Symbol" value={asset} onChange={(e) => setAsset(e.target.value)} fullWidth margin="normal" />
          <DatePicker
            value={dayjs(startDate)}
            onChange={handleStartDateChange}
            style={{ width: '100%', marginTop: '16px' }}
            disabledDate={(current) => current && current > dayjs(endDate)}
          />
          <DatePicker
            value={dayjs(endDate)}
            onChange={handleEndDateChange}
            style={{ width: '100%', marginTop: '16px' }}
            disabledDate={(current) => current && current < dayjs(startDate)}
          />
          <TextField label="Fees" type="number" value={fees} onChange={(e) => setFees(parseFloat(e.target.value))} fullWidth margin="normal" />
          <TextField label="Slippage" type="number" value={slippage} onChange={(e) => setSlippage(parseFloat(e.target.value))} fullWidth margin="normal" />
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardContent>
          <Typography variant="h5" gutterBottom>Strategy Builder</Typography>
          {strategies.map((strategy, strategyIndex) => (
            <div key={strategyIndex} className="mb-4 p-4 border rounded relative">
              <IconButton 
                onClick={() => deleteStrategy(strategyIndex)} 
                color="secondary"
                style={{ position: 'absolute', top: '8px', right: '8px' }}
              >
                <DeleteIcon />
              </IconButton>
              <TextField label="Strategy Name" value={strategy.name} onChange={(e) => updateStrategy(strategyIndex, 'name', e.target.value)} fullWidth margin="normal" />
              <TextField label="Allocation %" type="number" value={strategy.allocation} onChange={(e) => updateStrategy(strategyIndex, 'allocation', parseFloat(e.target.value))} fullWidth margin="normal" />
              <FormControl fullWidth margin="normal">
                <InputLabel>Position Type</InputLabel>
                <Select value={strategy.positionType} onChange={(e) => updateStrategy(strategyIndex, 'positionType', e.target.value)}>
                  <MenuItem value="long">Long</MenuItem>
                  <MenuItem value="short">Short</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="h6" gutterBottom>Entry Rules</Typography>
              {strategy.entryRules && strategy.entryRules.map((rule, ruleIndex) => (
                <RuleComponent
                    key={ruleIndex}
                    rule={rule}
                    ruleIndex={ruleIndex}
                    strategyIndex={strategyIndex}
                    ruleType="entryRules"
                    updateRule={updateRule}
                    updateIndicatorParam={updateIndicatorParam}
                    removeRule={removeRule}
                    indicators={INDICATORS}
                />
            ))}
              <Button onClick={() => addRule(strategyIndex, 'entryRules')} startIcon={<AddIcon />} variant="outlined" style={{ marginTop: '8px' }}>
                Add Entry Rule
              </Button>
              <Typography variant="h6" gutterBottom style={{ marginTop: '16px' }}>Exit Rules</Typography>
              {strategy.exitRules && strategy.exitRules.map((rule, ruleIndex) => (
                <RuleComponent
                    key={ruleIndex}
                    rule={rule}
                    ruleIndex={ruleIndex}
                    strategyIndex={strategyIndex}
                    ruleType="exitRules"
                    updateRule={updateRule}
                    updateIndicatorParam={updateIndicatorParam}
                    removeRule={removeRule}
                    indicators={INDICATORS}
                />
          ))}
              <Button onClick={() => addRule(strategyIndex, 'exitRules')} startIcon={<AddIcon />} variant="outlined" style={{ marginTop: '8px' }}>
                Add Exit Rule
              </Button>
            </div>
          ))}
          <Button onClick={addStrategy} variant="contained" color="primary">Add Strategy</Button>
        </CardContent>
      </Card>

      <Button onClick={runBacktest} variant="contained" color="primary" disabled={isLoading}>
        {isLoading ? 'Running Backtest...' : 'Run Backtest'}
      </Button>

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

const RuleComponent = ({ rule, ruleIndex, strategyIndex, ruleType, updateRule, updateIndicatorParam, removeRule, indicators }) => {
    if (!rule) {
      console.error('Rule is undefined:', { ruleIndex, strategyIndex, ruleType });
      return null;
    }
  
    return (
      <Box className="flex flex-wrap items-center mt-2">
        {ruleIndex > 0 && (
          <Select
            value={rule.logicalOperator || 'and'}
            onChange={(e) => updateRule(strategyIndex, ruleIndex, ruleType, 'logicalOperator', e.target.value)}
            style={{ width: '80px', marginRight: '8px' }}
          >
            {['and', 'or'].map(op => <MenuItem key={op} value={op}>{op}</MenuItem>)}
          </Select>
        )}
        <FormControl style={{ width: '120px', marginRight: '8px' }}>
          <InputLabel>Left Indicator</InputLabel>
          <Select
            value={rule.leftIndicator || ''}
            onChange={(e) => updateRule(strategyIndex, ruleIndex, ruleType, 'leftIndicator', e.target.value)}
          >
            {indicators.map(indicator => <MenuItem key={indicator.name} value={indicator.name}>{indicator.name}</MenuItem>)}
          </Select>
        </FormControl>
        {rule.leftIndicator && indicators.find(i => i.name === rule.leftIndicator)?.params.map(param => (
          <TextField
            key={param}
            label={param}
            value={(rule.leftParams && rule.leftParams[param]) || ''}
            onChange={(e) => updateIndicatorParam(strategyIndex, ruleIndex, ruleType, 'left', param, e.target.value)}
            style={{ width: '80px', marginRight: '8px' }}
          />
        ))}
        <Select
          value={rule.operator || '<'}
          onChange={(e) => updateRule(strategyIndex, ruleIndex, ruleType, 'operator', e.target.value)}
          style={{ width: '80px', marginRight: '8px' }}
        >
          {['<', '<=', '>', '>=', '==', '!='].map(op => <MenuItem key={op} value={op}>{op}</MenuItem>)}
        </Select>
        <FormControlLabel
          control={
            <Switch
              checked={rule.useRightIndicator || false}
              onChange={(e) => updateRule(strategyIndex, ruleIndex, ruleType, 'useRightIndicator', e.target.checked)}
            />
          }
          label="Use Indicator"
        />
        {rule.useRightIndicator ? (
          <>
            <FormControl style={{ width: '120px', marginRight: '8px' }}>
              <InputLabel>Right Indicator</InputLabel>
              <Select
                value={rule.rightIndicator || ''}
                onChange={(e) => updateRule(strategyIndex, ruleIndex, ruleType, 'rightIndicator', e.target.value)}
              >
                {indicators.map(indicator => <MenuItem key={indicator.name} value={indicator.name}>{indicator.name}</MenuItem>)}
              </Select>
            </FormControl>
            {rule.rightIndicator && indicators.find(i => i.name === rule.rightIndicator)?.params.map(param => (
              <TextField
                key={param}
                label={param}
                value={(rule.rightParams && rule.rightParams[param]) || ''}
                onChange={(e) => updateIndicatorParam(strategyIndex, ruleIndex, ruleType, 'right', param, e.target.value)}
                style={{ width: '80px', marginRight: '8px' }}
              />
            ))}
          </>
        ) : (
          <TextField
            label="Value"
            value={rule.rightValue || ''}
            onChange={(e) => updateRule(strategyIndex, ruleIndex, ruleType, 'rightValue', e.target.value)}
            style={{ width: '80px', marginRight: '8px' }}
          />
        )}
        <IconButton onClick={() => removeRule(strategyIndex, ruleIndex, ruleType)} color="secondary">
          <DeleteIcon />
        </IconButton>
      </Box>
    );
  };

export default QuantiFiBacktestingLab;