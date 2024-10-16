import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Box, Typography, Tabs, Tab } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PriceSignalChart = ({ signals, assetName }) => {
  const [activeStrategy, setActiveStrategy] = useState('');

  const strategies = useMemo(() => Object.keys(signals || {}), [signals]);

  const processStrategyData = useCallback((signalsList, strategyName) => {
    const dates = [];
    const prices = [];
    const longEntries = [];
    const longExits = [];
    const shortEntries = [];
    const shortExits = [];

    let lastSignal = 0;

    signalsList.forEach((item, index) => {
      const date = new Date(item.Date).toLocaleDateString();
      const price = item.Close;
      const signal = item[`${strategyName}_signal`];

      dates.push(date);
      prices.push(price);

      if (signal === 1 && lastSignal <= 0) {
        longEntries.push(price);
      } else {
        longEntries.push(null);
      }

      if (signal === 0 && lastSignal === 1) {
        longExits.push(price);
      } else {
        longExits.push(null);
      }

      if (signal === -1 && lastSignal >= 0) {
        shortEntries.push(price);
      } else {
        shortEntries.push(null);
      }

      if (signal === 0 && lastSignal === -1) {
        shortExits.push(price);
      } else {
        shortExits.push(null);
      }

      lastSignal = signal;
    });

    return {
      labels: dates,
      datasets: [
        {
          label: 'Price',
          data: prices,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: 'Long Entry',
          data: longEntries,
          backgroundColor: 'green',
          pointStyle: 'triangle',
          pointRadius: 6,
          showLine: false,
        },
        {
          label: 'Long Exit',
          data: longExits,
          backgroundColor: 'blue',
          pointStyle: 'triangle',
          pointRadius: 6,
          showLine: false,
        },
        {
          label: 'Short Entry',
          data: shortEntries,
          backgroundColor: 'red',
          pointStyle: 'triangle',
          pointRadius: 6,
          showLine: false,
        },
        {
          label: 'Short Exit',
          data: shortExits,
          backgroundColor: 'orange',
          pointStyle: 'triangle',
          pointRadius: 6,
          showLine: false,
        },
      ],
    };
  }, []);

  const chartData = useMemo(() => {
    if (!activeStrategy || !signals || !signals[activeStrategy]) return null;
    return processStrategyData(signals[activeStrategy], activeStrategy);
  }, [activeStrategy, signals, processStrategyData]);

  useEffect(() => {
    if (strategies.length > 0 && !activeStrategy) {
      setActiveStrategy(strategies[0]);
    }
  }, [strategies, activeStrategy]);

  const options = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: `Price and Signals - ${assetName}`,
      },
    },
    scales: {
      x: {
        ticks: { maxTicksLimit: 10 },
      },
    },
  }), [assetName]);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveStrategy(newValue);
  }, []);

  if (strategies.length === 0) {
    return <Typography variant="h6">No data available for charting.</Typography>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={activeStrategy}
        onChange={handleTabChange}
        aria-label="strategy tabs"
        sx={{ marginBottom: 2 }}
      >
        {strategies.map((strategy) => (
          <Tab label={strategy} value={strategy} key={strategy} />
        ))}
      </Tabs>
      <Box sx={{ height: 500 }}>
        {chartData ? (
          <Line options={options} data={chartData} />
        ) : (
          <Typography variant="h6">Loading chart data...</Typography>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(PriceSignalChart);


