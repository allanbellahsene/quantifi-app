import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Select } from './components/ui/select';
import { Input } from './components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Switch } from './components/ui/switch';
import { Slider } from './components/ui/slider';
import { Play, Save, Send, Plus, Trash2, Filter, ChevronUp, ChevronDown } from 'lucide-react';

const mockEquityData = [
  { name: 'Jan', Portfolio: 4000, 'Strategy 1': 3000, 'Strategy 2': 1000 },
  { name: 'Feb', Portfolio: 3000, 'Strategy 1': 2000, 'Strategy 2': 1000 },
  { name: 'Mar', Portfolio: 5000, 'Strategy 1': 3500, 'Strategy 2': 1500 },
  { name: 'Apr', Portfolio: 4500, 'Strategy 1': 3000, 'Strategy 2': 1500 },
  { name: 'May', Portfolio: 6000, 'Strategy 1': 4000, 'Strategy 2': 2000 },
  { name: 'Jun', Portfolio: 5500, 'Strategy 1': 3500, 'Strategy 2': 2000 },
];

const mockAllocationData = [
  { name: 'Strategy 1', value: 60 },
  { name: 'Strategy 2', value: 40 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const StrategyRuleBuilder = ({ ruleType }) => (
  <div className="space-y-4">
    <div className="flex items-center space-x-2">
      <Select className="w-1/5">
        <option>{ruleType}</option>
      </Select>
      <Select className="w-1/5">
        <option>Price</option>
        <option>Volume</option>
        <option>RSI</option>
        <option>Moving Average</option>
      </Select>
      <Select className="w-1/5">
        <option>Crosses Above</option>
        <option>Crosses Below</option>
        <option>Is Greater Than</option>
        <option>Is Less Than</option>
      </Select>
      <Input type="number" placeholder="Value" className="w-1/5" />
      <Button size="sm" className="w-1/5">
        <Plus className="w-4 h-4 mr-2" /> Add
      </Button>
    </div>
  </div>
);

const AdvancedBacktestingLab = () => {
  const [universeType, setUniverseType] = useState('single');
  const [showFilters, setShowFilters] = useState(false);
  const [strategies, setStrategies] = useState([
    { 
      id: 1, 
      allocation: 100, 
      showRules: false,
      direction: 'long-short',
      timeFrequency: '1 day',
      positionSizing: 'Constant (1)'
    }
  ]);
  const [ruleType, setRuleType] = useState('general');
  const [mutuallyExclusive, setMutuallyExclusive] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleAddStrategy = () => {
    const newStrategy = {
      id: strategies.length + 1,
      allocation: mutuallyExclusive ? 100 : Math.floor(100 / (strategies.length + 1)),
      showRules: false,
      direction: 'long-short',
      timeFrequency: '1 day',
      positionSizing: 'Constant (1)'
    };
    setStrategies([...strategies, newStrategy]);
    if (!mutuallyExclusive) {
      const updatedStrategies = strategies.map(strategy => ({
        ...strategy,
        allocation: Math.floor(100 / (strategies.length + 1))
      }));
      setStrategies([...updatedStrategies, newStrategy]);
    }
  };

  const handleRemoveStrategy = (id) => {
    const updatedStrategies = strategies.filter(strategy => strategy.id !== id);
    setStrategies(updatedStrategies);
    if (!mutuallyExclusive) {
      const newAllocation = Math.floor(100 / updatedStrategies.length);
      setStrategies(updatedStrategies.map(strategy => ({ ...strategy, allocation: newAllocation })));
    }
  };


  const handleAllocationChange = (id, value) => {
    const updatedStrategies = strategies.map(strategy => 
      strategy.id === id ? { ...strategy, allocation: value } : strategy
    );
    setStrategies(updatedStrategies);
  };

  const handleStrategyChange = (id, field, value) => {
    setStrategies(strategies.map(strategy =>
      strategy.id === id ? { ...strategy, [field]: value } : strategy
    ));
  };

  const toggleRules = (id) => {
    setStrategies(strategies.map(strategy =>
      strategy.id === id ? { ...strategy, showRules: !strategy.showRules } : strategy
    ));
  };

  const handleRunBacktest = () => {
    setShowResults(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">QuantiFi Advanced Backtesting Lab</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-2xl font-semibold">Strategy Builder</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2">Select Investment Universe</label>
              <Select value={universeType} onChange={(e) => setUniverseType(e.target.value)}>
                <option value="single">Single Asset</option>
                <option value="multiple">Multiple Assets</option>
                <option value="universe">Investment Universe</option>
              </Select>
            </div>
            <div>
              <label className="block mb-2">Backtest Time Period</label>
              <div className="flex space-x-2">
                <Input type="date" className="w-1/2" />
                <Input type="date" className="w-1/2" />
              </div>
            </div>
          </div>

          {universeType === 'single' && (
            <div className="mb-4">
              <label className="block mb-2">Select Asset</label>
              <Select>
                <option>BTC/USD</option>
                <option>ETH/USD</option>
                <option>S&P 500</option>
              </Select>
            </div>
          )}

          {universeType === 'multiple' && (
            <div className="mb-4">
              <label className="block mb-2">Select Assets</label>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">BTC/USD</Button>
                <Button size="sm">ETH/USD</Button>
                <Button size="sm">S&P 500</Button>
                <Button size="sm" variant="outline">+ Add Asset</Button>
              </div>
            </div>
          )}

          {universeType === 'universe' && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label>Investment Universe Filters</label>
                <Button size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="w-4 h-4 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>
              {showFilters && (
                <Card>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2">Asset Class</label>
                        <Select>
                          <option>Stocks</option>
                          <option>Crypto</option>
                        </Select>
                      </div>
                      <div>
                        <label className="block mb-2">Min Daily Traded Volume</label>
                        <Input type="number" placeholder="Enter volume" />
                      </div>
                      <div>
                        <label className="block mb-2">Min Market Cap</label>
                        <Input type="number" placeholder="Enter market cap" />
                      </div>
                      <div>
                        <label className="block mb-2">Must Trade Since (days)</label>
                        <Input type="number" placeholder="Enter days" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {universeType !== 'single' && (
            <div className="mb-4">
              <label className="block mb-2">Strategies</label>
              <div className="space-y-4">
                {strategies.map((strategy, index) => (
                  <Card key={strategy.id}>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold">Strategy {strategy.id}</span>
                        <div className="flex items-center space-x-4">
                          <label>Allocation:</label>
                          <Input 
                            type="number" 
                            value={strategy.allocation} 
                            onChange={(e) => handleStrategyChange(strategy.id, 'allocation', parseInt(e.target.value))}
                            className="w-20"
                            min="0"
                            max="100"
                          />
                          <span>%</span>
                          {strategies.length > 1 && (
                            <Button size="sm" variant="outline" onClick={() => handleRemoveStrategy(strategy.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block mb-2">Direction</label>
                          <Select 
                            value={strategy.direction}
                            onChange={(e) => handleStrategyChange(strategy.id, 'direction', e.target.value)}
                          >
                            <option value="long-only">Long Only</option>
                            <option value="short-only">Short Only</option>
                            <option value="long-short">Long-Short</option>
                          </Select>
                        </div>
                        <div>
                          <label className="block mb-2">Time Frequency</label>
                          <Select
                            value={strategy.timeFrequency}
                            onChange={(e) => handleStrategyChange(strategy.id, 'timeFrequency', e.target.value)}
                          >
                            <option>1 minute</option>
                            <option>5 minutes</option>
                            <option>15 minutes</option>
                            <option>1 hour</option>
                            <option>4 hours</option>
                            <option>1 day</option>
                          </Select>
                        </div>
                        <div>
                          <label className="block mb-2">Position Sizing</label>
                          <Select
                            value={strategy.positionSizing}
                            onChange={(e) => handleStrategyChange(strategy.id, 'positionSizing', e.target.value)}
                          >
                            <option>Constant (1)</option>
                            <option>Percentage of Capital</option>
                            <option>Kelly Criterion</option>
                            <option>Volatility Target</option>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Button 
                          onClick={() => toggleRules(strategy.id)}
                          className="w-full justify-between"
                        >
                          Strategy Rules
                          {strategy.showRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        {strategy.showRules && (
                          <Card className="mt-2">
                            <CardContent>
                              <Tabs defaultValue="long_entry">
                                <TabsList>
                                  <TabsTrigger value="long_entry">Long Entry</TabsTrigger>
                                  <TabsTrigger value="long_exit">Long Exit</TabsTrigger>
                                  {strategy.direction !== 'long-only' && (
                                    <>
                                      <TabsTrigger value="short_entry">Short Entry</TabsTrigger>
                                      <TabsTrigger value="short_exit">Short Exit</TabsTrigger>
                                    </>
                                  )}
                                </TabsList>
                                <TabsContent value="long_entry">
                                  <StrategyRuleBuilder ruleType="Long Entry" />
                                </TabsContent>
                                <TabsContent value="long_exit">
                                  <StrategyRuleBuilder ruleType="Long Exit" />
                                </TabsContent>
                                {strategy.direction !== 'long-only' && (
                                  <>
                                    <TabsContent value="short_entry">
                                      <StrategyRuleBuilder ruleType="Short Entry" />
                                    </TabsContent>
                                    <TabsContent value="short_exit">
                                      <StrategyRuleBuilder ruleType="Short Exit" />
                                    </TabsContent>
                                  </>
                                )}
                              </Tabs>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button onClick={handleAddStrategy}>
                  <Plus className="w-4 h-4 mr-2" /> Add Strategy
                </Button>
              </div>
            </div>
          )}

          {universeType !== 'single' && (
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="mutually-exclusive" 
                  checked={mutuallyExclusive}
                  onCheckedChange={setMutuallyExclusive}
                />
                <label htmlFor="mutually-exclusive">Strategies are mutually exclusive</label>
              </div>
            </div>
          )}

          {universeType === 'multiple' && (
            <div className="mb-4">
              <label className="block mb-2">Rule Type</label>
              <Select value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
                <option value="general">General Rules</option>
                <option value="asset-specific">Asset-Specific Rules</option>
              </Select>
            </div>
          )}

          <Button onClick={handleRunBacktest}>
            <Play className="w-4 h-4 mr-2" /> Run Backtest
          </Button>
        </CardContent>
      </Card>
      
      {showResults && (
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Backtest Results</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Equity Curve</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockEquityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
                <ul className="space-y-2">
                  <li>Sharpe Ratio: 1.5</li>
                  <li>Max Drawdown: -15%</li>
                  <li>Annual Return: 22%</li>
                  <li>Win Rate: 60%</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Trade Analysis</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Signal</th>
                    <th className="border p-2">Entry Price</th>
                    <th className="border p-2">Exit Price</th>
                    <th className="border p-2">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">2024-01-15</td>
                    <td className="border p-2">Long</td>
                    <td className="border p-2">$100</td>
                    <td className="border p-2">$110</td>
                    <td className="border p-2 text-green-600">+10%</td>
                  </tr>
                  <tr>
                    <td className="border p-2">2024-02-01</td>
                    <td className="border p-2">Short</td>
                    <td className="border p-2">$120</td>
                    <td className="border p-2">$115</td>
                    <td className="border p-2 text-green-600">+4.17%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex space-x-4">
              <Button>
                <Save className="w-4 h-4 mr-2" /> Save Strategy
              </Button>
              <Button>
                <Send className="w-4 h-4 mr-2" /> Connect to API
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedBacktestingLab;