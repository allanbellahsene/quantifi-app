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
      left_window: 1,
      comparison: '>=',
      right_indicator: 'Rolling High',
      right_window: 10,
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
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-pink-500">Custom Rule Builder</h3>
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="mb-2">
          <span className="text-sm font-medium">Number of rules</span>
          <InputNumber
            value={rules.length}
            onChange={(value) => {
              const newRules = [...rules];
              if (value > newRules.length) {
                while (newRules.length < value) {
                  addRule();
                }
              } else {
                newRules.length = value;
              }
              setRules(newRules);
              onStrategyChange(newRules);
            }}
            min={0}
            className="ml-2 w-20 bg-gray-600 text-white"
          />
        </div>
        {rules.map((rule, index) => (
          <div key={index} className="mb-4 p-2 bg-gray-800 rounded">
            <Space wrap className="mb-2">
              <Select
                value={rule.left_indicator}
                onChange={(value) => updateRule(index, 'left_indicator', value)}
                className="w-32"
                dropdownClassName="bg-gray-700"
              >
                {indicators.map(ind => <Option key={ind} value={ind}>{ind}</Option>)}
              </Select>
              <InputNumber
                value={rule.left_window}
                onChange={(value) => updateRule(index, 'left_window', value)}
                className="w-20 bg-gray-600 text-white"
              />
              <Select
                value={rule.comparison}
                onChange={(value) => updateRule(index, 'comparison', value)}
                className="w-20"
                dropdownClassName="bg-gray-700"
              >
                {comparisons.map(comp => <Option key={comp} value={comp}>{comp}</Option>)}
              </Select>
              <Select
                value={rule.right_indicator}
                onChange={(value) => updateRule(index, 'right_indicator', value)}
                className="w-32"
                dropdownClassName="bg-gray-700"
              >
                {indicators.map(ind => <Option key={ind} value={ind}>{ind}</Option>)}
              </Select>
              <InputNumber
                value={rule.right_window}
                onChange={(value) => updateRule(index, 'right_window', value)}
                className="w-20 bg-gray-600 text-white"
              />
              <Select
                value={rule.action}
                onChange={(value) => updateRule(index, 'action', value)}
                className="w-24"
                dropdownClassName="bg-gray-700"
              >
                {actions.map(act => <Option key={act} value={act}>{act}</Option>)}
              </Select>
            </Space>
          </div>
        ))}
      </div>
      <Button
        onClick={addRule}
        className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
      >
        Add Rule
      </Button>
    </div>
  );
};

export default StrategyBuilder;