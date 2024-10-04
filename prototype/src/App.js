import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Play, Save, Send, Plus, Trash2, Filter } from 'lucide-react';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Select } from './components/ui/select';
import { Input } from './components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Switch } from './components/ui/switch';
import { Slider } from './components/ui/slider';

const AdvancedBacktestingLab = () => {
  const [universeType, setUniverseType] = useState('single');
  const [showFilters, setShowFilters] = useState(false);
  const [strategies, setStrategies] = useState([{ id: 1, allocation: 100 }]);
  const [ruleType, setRuleType] = useState('general');
  const [mutuallyExclusive, setMutuallyExclusive] = useState(false);

  const handleAddStrategy = () => {
    const newStrategy = {
      id: strategies.length + 1,
      allocation: mutuallyExclusive ? 100 : Math.floor(100 / (strategies.length + 1))
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

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">QuantiFi Advanced Backtesting Lab</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-2xl font-semibold">Strategy Builder</h2>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block mb-2">Select Investment Universe</label>
            <Select value={universeType} onChange={(e) => setUniverseType(e.target.value)}>
              <option value="single">Single Asset</option>
              <option value="multiple">Multiple Assets</option>
              <option value="universe">Investment Universe</option>
            </Select>
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
                    <CardContent className="flex items-center justify-between">
                      <span>Strategy {strategy.id}</span>
                      <div className="flex items-center space-x-4">
                        <label>Allocation:</label>
                        <Input 
                          type="number" 
                          value={strategy.allocation} 
                          onChange={(e) => handleAllocationChange(strategy.id, parseInt(e.target.value))}
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

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Strategy Rules</h3>
            <Card>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Select className="w-1/4">
                      <option>Entry</option>
                      <option>Exit</option>
                    </Select>
                    <Select className="w-1/4">
                      <option>Price</option>
                      <option>Volume</option>
                      <option>RSI</option>
                      <option>Moving Average</option>
                    </Select>
                    <Select className="w-1/4">
                      <option>Crosses Above</option>
                      <option>Crosses Below</option>
                      <option>Is Greater Than</option>
                      <option>Is Less Than</option>
                    </Select>
                    <Input type="number" placeholder="Value" className="w-1/4" />
                  </div>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Position Sizing</h3>
            <Select>
              <option>Constant (1)</option>
              <option>Percentage of Capital</option>
              <option>Kelly Criterion</option>
              <option>Volatility Target</option>
            </Select>
          </div>

          <Button>
            <Play className="w-4 h-4 mr-2" /> Run Backtest
          </Button>
        </CardContent>
      </Card>

      {/* Backtest Results section would go here, similar to the previous version */}
    </div>
  );
};

export default AdvancedBacktestingLab;