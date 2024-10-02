import React, { useState } from 'react';
import { Button, Select, InputNumber, Space } from 'antd';

const { Option } = Select;

const indicators = ['Close', 'Open', 'High', 'Low', 'Volume', 'BTC', 'BTC_MA', 'Coin_MA', 'SMA', 'EMA', 'Rolling High', 'Rolling Low'];
const comparisons = ['>', '<', '==', '>=', '<='];
const actions = ['Buy', 'Sell'];

const StrategyBuilder = ({ onStrategyChange }) => {
  const [rules, setRules] = useState([]);

  const addRule = () => {
    setRules([...rules, {
      left_indicator: 'Close',
      left_window: 10,
      comparison: '>',
      right_indicator: 'SMA',
      right_window: 20,
      action: 'Buy'
    }]);
  };

  const updateRule = (index, field, value) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
    onStrategyChange(newRules);
  };

  return (
    <div>
      <h2>Strategy Builder</h2>
      {rules.map((rule, index) => (
        <Space key={index} style={{ marginBottom: 16 }}>
          <Select
            value={rule.left_indicator}
            onChange={(value) => updateRule(index, 'left_indicator', value)}
          >
            {indicators.map(ind => <Option key={ind} value={ind}>{ind}</Option>)}
          </Select>
          <InputNumber
            value={rule.left_window}
            onChange={(value) => updateRule(index, 'left_window', value)}
          />
          <Select
            value={rule.comparison}
            onChange={(value) => updateRule(index, 'comparison', value)}
          >
            {comparisons.map(comp => <Option key={comp} value={comp}>{comp}</Option>)}
          </Select>
          <Select
            value={rule.right_indicator}
            onChange={(value) => updateRule(index, 'right_indicator', value)}
          >
            {indicators.map(ind => <Option key={ind} value={ind}>{ind}</Option>)}
          </Select>
          <InputNumber
            value={rule.right_window}
            onChange={(value) => updateRule(index, 'right_window', value)}
          />
          <Select
            value={rule.action}
            onChange={(value) => updateRule(index, 'action', value)}
          >
            {actions.map(act => <Option key={act} value={act}>{act}</Option>)}
          </Select>
        </Space>
      ))}
      <Button onClick={addRule}>Add Rule</Button>
    </div>
  );
};

export default StrategyBuilder;