import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

    signalsList.forEach((item) => {
      const date = new Date(item.Date).toLocaleDateString();
      const price = item.Close;
      const signal = item[`${strategyName}_signal`];

      dates.push(date);
      prices.push(price);

      // Enhanced signal visibility
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
          borderColor: 'rgba(0, 0, 0, 0.8)', // Changed to black
          backgroundColor: 'rgba(0, 0, 0, 0.05)', // Light black/gray fill
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
          fill: true,
          z: 1,
        },
        {
          label: 'Long Entry',
          data: longEntries,
          backgroundColor: 'rgba(46, 204, 113, 1)', // Keeping green for long entry
          borderColor: 'rgba(46, 204, 113, 1)',
          pointStyle: 'triangle',
          rotation: 0,
          pointRadius: 12,
          pointHoverRadius: 15,
          showLine: false,
          z: 2,
        },
        {
          label: 'Long Exit',
          data: longExits,
          backgroundColor: 'rgba(231, 76, 60, 1)', // Changed to red
          borderColor: 'rgba(231, 76, 60, 1)',
          pointStyle: 'triangle',
          rotation: 180,
          pointRadius: 12,
          pointHoverRadius: 15,
          showLine: false,
          z: 2,
        },
        {
          label: 'Short Entry',
          data: shortEntries,
          backgroundColor: 'rgba(243, 156, 18, 1)', // Changed to orange
          borderColor: 'rgba(243, 156, 18, 1)',
          pointStyle: 'triangle',
          rotation: 180,
          pointRadius: 12,
          pointHoverRadius: 15,
          showLine: false,
          z: 2,
        },
        {
          label: 'Short Exit',
          data: shortExits,
          backgroundColor: 'rgba(241, 196, 15, 1)', // Changed to yellow
          borderColor: 'rgba(241, 196, 15, 1)',
          pointStyle: 'triangle',
          rotation: 0,
          pointRadius: 12,
          pointHoverRadius: 15,
          showLine: false,
          z: 2,
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
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: `Price and Signals - ${assetName}`,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 10,
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'linear'
      }
    }
  }), [assetName]);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveStrategy(newValue);
  }, []);

  if (strategies.length === 0) {
    return <Typography variant="h6">No data available for charting.</Typography>;
  }

  return (
    <Paper elevation={2} sx={{ p: 2, backgroundColor: '#ffffff' }}>
      <Tabs
        value={activeStrategy}
        onChange={handleTabChange}
        aria-label="strategy tabs"
        sx={{
          mb: 2,
          '& .MuiTab-root': {
            fontWeight: 'bold',
            fontSize: '0.9rem',
          },
          '& .Mui-selected': {
            color: 'primary.main',
          }
        }}
      >
        {strategies.map((strategy) => (
          <Tab label={strategy} value={strategy} key={strategy} />
        ))}
      </Tabs>
      <Box sx={{ 
        height: 600,
        p: 2,
        backgroundColor: '#ffffff',
        borderRadius: 1
      }}>
        {chartData ? (
          <Line options={options} data={chartData} />
        ) : (
          <Typography variant="h6">Loading chart data...</Typography>
        )}
      </Box>
    </Paper>
  );
};

export default React.memo(PriceSignalChart);


