import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, Typography, FormGroup, FormControlLabel, Switch, Checkbox, Box, useTheme } from '@mui/material';
import dayjs from 'dayjs';

const EquityCurveChart = ({ data, strategies, assetName, startDate, endDate }) => {
    const [showBenchmark, setShowBenchmark] = useState(true);
    const [visibleStrategies, setVisibleStrategies] = useState({});
    const [useLogEquity, setUseLogEquity] = useState(false); // Default is off
    const theme = useTheme();

    const toggleStrategy = (strategyName) => {
        setVisibleStrategies(prev => ({ ...prev, [strategyName]: !prev[strategyName] }));
    };

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#B19CD9', '#FF90B3'];

    const formatYAxis = (value) => {
        return useLogEquity ? value.toFixed(0) : value.toFixed(2);
    };
    
    const formatXAxis = (dateStr) => {
        const date = dayjs(dateStr);
        return date.isValid() ? date.format('MMM YYYY') : 'Invalid Date';
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const date = dayjs(label);
            return (
                <div className="custom-tooltip" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '10px', border: '1px solid #ccc' }}>
                    <p className="label">{`Date: ${date.format('YYYY-MM-DD')}`}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value.toFixed(2)}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const shouldShowTick = (tickItem) => {
        const date = dayjs(tickItem);
        return date.month() % 4 === 0;
    };

    const yAxisDomain = useMemo(() => {
        if (!data || data.length === 0) return [0, 'auto'];
        const allValues = data.flatMap(item => [
            useLogEquity ? item.cumulative_log_equity : item.cumulative_equity,
            useLogEquity ? item.cumulative_log_market_equity : item.cumulative_market_equity,
            ...strategies.map(s => item[`${s.name}_${useLogEquity ? 'cumulative_log_equity' : 'cumulative_equity'}`])
        ].filter(Boolean));
        const minValue = Math.floor(Math.min(...allValues));
        const maxValue = Math.ceil(Math.max(...allValues));
        return [minValue, maxValue];
    }, [data, strategies, useLogEquity]);

    return (
        <Card elevation={3} sx={{ marginTop: 4, marginBottom: 4 }}>
            <CardContent>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                    {/* Add any title or additional content here if needed */}
                </Typography>
                {/* Align toggles and checkbox on opposite sides */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    {/* Left side: Benchmark and Strategy Toggles */}
                    <FormGroup row>
                        <FormControlLabel
                            control={<Switch checked={showBenchmark} onChange={() => setShowBenchmark(!showBenchmark)} color="primary" />}
                            label="Buy & Hold"
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
                    {/* Right side: Log Returns Checkbox */}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={useLogEquity}
                                onChange={() => setUseLogEquity(!useLogEquity)}
                                color="primary"
                            />
                        }
                        label="Log Returns"
                    />
                </Box>
                <ResponsiveContainer width="100%" height={500}>
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis 
                            dataKey="Date" 
                            tickFormatter={formatXAxis} 
                            domain={[startDate, endDate]}
                            type="category"
                            stroke={theme.palette.text.secondary}
                            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                            interval="preserveStartEnd"
                            ticks={data.filter((item, index) => shouldShowTick(item.Date)).map(item => item.Date)}
                        />
                        <YAxis 
                            tickFormatter={formatYAxis} 
                            domain={yAxisDomain}
                            stroke={theme.palette.text.secondary}
                            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                            label={{ 
                                value: useLogEquity ? 'Log Equity' : 'Equity', 
                                angle: -90, 
                                position: 'insideLeft',
                                style: { textAnchor: 'middle', fill: theme.palette.text.primary, fontSize: 14 }
                            }}
                            ticks={Array.from(
                                { length: yAxisDomain[1] - yAxisDomain[0] + 1 }, 
                                (_, i) => i + yAxisDomain[0]
                            )}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                            type="monotone"
                            dataKey={useLogEquity ? "cumulative_log_equity" : "cumulative_equity"}
                            name="Portfolio"
                            stroke={theme.palette.primary.main}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 8 }}
                        />
                        {showBenchmark && (
                            <Line
                                type="monotone"
                                dataKey={useLogEquity ? "cumulative_log_market_equity" : "cumulative_market_equity"}
                                name="Buy & Hold"
                                stroke={theme.palette.secondary.main}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 8 }}
                            />
                        )}
                        {strategies.map((strategy, index) => 
                            visibleStrategies[strategy.name] && (
                                <Line
                                    key={strategy.name}
                                    type="monotone"
                                    dataKey={`${strategy.name}_${useLogEquity ? 'cumulative_log_equity' : 'cumulative_equity'}`}
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
            </CardContent>
        </Card>
    );
};

export default React.memo(EquityCurveChart);

