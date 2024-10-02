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
      leftIndicator: 'Close',
      leftWindow: 10,
      comparison: '>',
      rightIndicator: 'SMA',
      rightWindow: 20,
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
            value={rule.leftIndicator}
            onChange={(value) => updateRule(index, 'leftIndicator', value)}
          >
            {indicators.map(ind => <Option key={ind} value={ind}>{ind}</Option>)}
          </Select>
          <InputNumber
            value={rule.leftWindow}
            onChange={(value) => updateRule(index, 'leftWindow', value)}
          />
          <Select
            value={rule.comparison}
            onChange={(value) => updateRule(index, 'comparison', value)}
          >
            {comparisons.map(comp => <Option key={comp} value={comp}>{comp}</Option>)}
          </Select>
          <Select
            value={rule.rightIndicator}
            onChange={(value) => updateRule(index, 'rightIndicator', value)}
          >
            {indicators.map(ind => <Option key={ind} value={ind}>{ind}</Option>)}
          </Select>
          <InputNumber
            value={rule.rightWindow}
            onChange={(value) => updateRule(index, 'rightWindow', value)}
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