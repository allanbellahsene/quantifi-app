import React, { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FormGroup, FormControlLabel, Switch, useTheme } from '@mui/material';
import dayjs from 'dayjs';

const DrawdownChart = ({ data, strategies, assetName }) => {
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [visibleStrategies, setVisibleStrategies] = useState({});
  const theme = useTheme();

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#B19CD9', '#FF90B3'];

  const formatYAxis = useCallback((value) => `${(value * 100).toFixed(0)}%`, []);
  
  const formatXAxis = useCallback((dateStr) => {
    const date = dayjs(dateStr);
    return date.isValid() ? date.format('MMM YYYY') : '';
  }, []);

  const shouldShowTick = (tickItem) => {
    const date = dayjs(tickItem);
    return date.month() % 4 === 0;
  };

  const toggleStrategy = useCallback((strategyName) => {
    setVisibleStrategies(prev => ({ ...prev, [strategyName]: !prev[strategyName] }));
  }, []);

  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = dayjs(label);
      return (
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '10px', border: '1px solid #ccc' }}>
          <p>{`Date: ${date.format('YYYY-MM-DD')}`}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${(entry.value * 100).toFixed(2)}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, []);

  return (
    <>
      <FormGroup row sx={{ marginBottom: 2 }}>
        <FormControlLabel
          control={<Switch checked={showBenchmark} onChange={() => setShowBenchmark(!showBenchmark)} color="primary" />}
          label="Benchmark"
        />
        {strategies.map((strategy, index) => (
          <FormControlLabel
            key={strategy.name}
            control={
              <Switch
                checked={visibleStrategies[strategy.name] || false}
                onChange={() => toggleStrategy(strategy.name)}
                color="primary"
              />
            }
            label={strategy.name}
          />
        ))}
      </FormGroup>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            dataKey="Date" 
            tickFormatter={formatXAxis} 
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={70}
            ticks={data.filter((item, index) => shouldShowTick(item.Date)).map(item => item.Date)}
          />
          <YAxis 
            tickFormatter={formatYAxis} 
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            label={{ 
              value: 'Drawdown (%)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: theme.palette.text.primary, fontSize: 14 }
            }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="portfolio_drawdown"
            name="Portfolio"
            stroke={theme.palette.primary.main}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 8 }}
          />
          {showBenchmark && (
            <Line
              type="monotone"
              dataKey="market_drawdown"
              name="Benchmark"
              stroke={theme.palette.secondary.main}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 8 }}
            />
          )}
          {strategies.map((strategy, index) => 
            visibleStrategies[strategy.name] && (
              <Line
                key={strategy.name}
                type="monotone"
                dataKey={`${strategy.name}_drawdown`}
                name={strategy.name}
                stroke={colors[index % colors.length]}
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            )
          )}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

export default React.memo(DrawdownChart);
