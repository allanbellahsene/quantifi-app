import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Box, Typography, Tabs, Tab } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TradeReturnsHistogram = ({ trades }) => {
  const [activeStrategy, setActiveStrategy] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('Trades data:', trades);
    if (!trades || trades.length === 0) {
      console.log('No trades data available');
    }
  }, [trades]);

  // Get unique strategies
  const strategies = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    const uniqueStrategies = [...new Set(trades.map(trade => trade.strategy))];
    console.log('Unique strategies:', uniqueStrategies);
    return ['Portfolio', ...uniqueStrategies].filter(Boolean); // Filter out any undefined/null values
  }, [trades]);

  // Set initial active strategy
  useEffect(() => {
    if (strategies.length > 0 && !activeStrategy) {
      setActiveStrategy(strategies[0]);
      console.log('Setting initial active strategy:', strategies[0]);
    }
  }, [strategies, activeStrategy]);

  // Calculate histogram bins
  const calculateHistogram = useCallback((returns) => {
    if (!returns || returns.length === 0) return {};
    
    const binWidth = 0.01; // 1% bins
    const minReturn = Math.floor(Math.min(...returns) * 100) / 100;
    const maxReturn = Math.ceil(Math.max(...returns) * 100) / 100;
    const bins = {};
    
    console.log('Return range:', { minReturn, maxReturn });

    // Initialize bins
    for (let bin = minReturn; bin <= maxReturn; bin += binWidth) {
      const binKey = bin.toFixed(3);
      bins[binKey] = 0;
    }

    // Count returns in each bin
    returns.forEach(ret => {
      const binKey = (Math.floor(ret / binWidth) * binWidth).toFixed(3);
      if (bins[binKey] !== undefined) {
        bins[binKey]++;
      }
    });

    return bins;
  }, []);

  // Process data for the selected strategy
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0 || !activeStrategy) {
      console.log('Cannot create chart data: missing trades or active strategy');
      return null;
    }

    const filteredTrades = activeStrategy === 'Portfolio' 
      ? trades 
      : trades.filter(trade => trade.strategy === activeStrategy);

    console.log('Filtered trades count:', filteredTrades.length);

    if (filteredTrades.length === 0) {
      console.log('No trades after filtering');
      return null;
    }

    const returns = filteredTrades.map(trade => trade.trade_return);
    console.log('Trade returns:', returns);

    const histogram = calculateHistogram(returns);

    return {
      labels: Object.keys(histogram).map(bin => `${(parseFloat(bin) * 100).toFixed(1)}%`),
      datasets: [{
        label: 'Number of Trades',
        data: Object.values(histogram),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }]
    };
  }, [activeStrategy, trades, calculateHistogram]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!trades || trades.length === 0 || !activeStrategy) return {
      count: 0,
      mean: 0,
      std: 0,
      win_rate: 0
    };

    const filteredTrades = activeStrategy === 'Portfolio' 
      ? trades 
      : trades.filter(trade => trade.strategy === activeStrategy);

    const returns = filteredTrades.map(trade => trade.trade_return);
    
    if (returns.length === 0) return {
      count: 0,
      mean: 0,
      std: 0,
      win_rate: 0
    };

    const mean = returns.reduce((acc, val) => acc + val, 0) / returns.length;
    
    return {
      count: returns.length,
      mean: mean,
      std: Math.sqrt(
        returns.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / returns.length
      ),
      win_rate: returns.filter(r => r > 0).length / returns.length
    };
  }, [activeStrategy, trades]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Trade Returns Distribution - ${activeStrategy || 'Loading...'}`,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Return (%)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Number of Trades'
        }
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveStrategy(newValue);
    console.log('Changed active strategy to:', newValue);
  };

  // Early return if no data
  if (!trades || trades.length === 0) {
    return (
      <Box className="w-full mt-8">
        <Typography variant="h6">No trade data available for histogram.</Typography>
      </Box>
    );
  }

  // Early return if no strategies
  if (strategies.length === 0) {
    return (
      <Box className="w-full mt-8">
        <Typography variant="h6">No strategies found in trade data.</Typography>
      </Box>
    );
  }

  return (
    <Box className="w-full mt-8">
      <Tabs
        value={activeStrategy}
        onChange={handleTabChange}
        className="mb-4"
      >
        {strategies.map((strategy) => (
          <Tab key={strategy} label={strategy} value={strategy} />
        ))}
      </Tabs>
      
      <Box className="flex flex-col gap-4">
        <Box className="grid grid-cols-4 gap-4">
          <Box className="p-4 bg-gray-100 rounded-lg">
            <Typography className="text-sm text-gray-600">Number of Trades</Typography>
            <Typography className="text-lg font-semibold">{statistics.count}</Typography>
          </Box>
          <Box className="p-4 bg-gray-100 rounded-lg">
            <Typography className="text-sm text-gray-600">Mean Return</Typography>
            <Typography className="text-lg font-semibold">{(statistics.mean * 100).toFixed(2)}%</Typography>
          </Box>
          <Box className="p-4 bg-gray-100 rounded-lg">
            <Typography className="text-sm text-gray-600">Standard Deviation</Typography>
            <Typography className="text-lg font-semibold">{(statistics.std * 100).toFixed(2)}%</Typography>
          </Box>
          <Box className="p-4 bg-gray-100 rounded-lg">
            <Typography className="text-sm text-gray-600">Win Rate</Typography>
            <Typography className="text-lg font-semibold">{(statistics.win_rate * 100).toFixed(2)}%</Typography>
          </Box>
        </Box>
        
        <Box className="h-96">
          {chartData ? (
            <Bar options={options} data={chartData} />
          ) : (
            <Typography variant="h6">No data available for selected strategy.</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(TradeReturnsHistogram);