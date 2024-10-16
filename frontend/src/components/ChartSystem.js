// ChartSystem.js
import React, { useState, useMemo, useCallback } from 'react';
import { FormGroup, FormControlLabel, Switch, Box } from '@mui/material';
import EquityCurveChart from './EquityCurveChart';
import RollingSharpeChart from './RollingSharpeChart';
import DrawdownChart from './DrawdownChart';
import CollapsibleChart from './CollapsibleChart';
import PriceSignalChart from './PriceSignalChart';

const ChartSystem = ({ equityCurveData, drawdownData, rollingSharpeData, strategies, assetName, startDate, endDate, signals }) => {
  const [visibleCharts, setVisibleCharts] = useState({
    equityCurve: true,
    rollingSharpe: false,
    drawdown: false,
    priceSignal: true
  });

  const toggleChartVisibility = useCallback((chartName) => {
    setVisibleCharts(prev => ({ ...prev, [chartName]: !prev[chartName] }));
  }, []);

  const downsampleData = useCallback((data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    const factor = Math.ceil(data.length / 1000);
    return data.filter((_, index) => index % factor === 0);
  }, []);

  const downsampledEquityCurve = useMemo(() => downsampleData(equityCurveData), [equityCurveData, downsampleData]);
  const downsampledDrawdown = useMemo(() => downsampleData(drawdownData), [drawdownData, downsampleData]);
  const downsampledRollingSharpe = useMemo(() => downsampleData(rollingSharpeData), [rollingSharpeData, downsampleData]);

  // **Do not downsample signals**
  const processedSignals = useMemo(() => signals, [signals]);

  console.log("Downsampled data lengths:", {
    equityCurve: downsampledEquityCurve.length,
    drawdown: downsampledDrawdown.length,
    rollingSharpe: downsampledRollingSharpe.length,
    signals: Object.keys(processedSignals).map(key => processedSignals[key].length)
  });

  return (
    <Box>
      <FormGroup row sx={{ marginBottom: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={visibleCharts.equityCurve}
              onChange={() => toggleChartVisibility('equityCurve')}
            />
          }
          label="Equity Curve"
        />
        <FormControlLabel
          control={
            <Switch
              checked={visibleCharts.rollingSharpe}
              onChange={() => toggleChartVisibility('rollingSharpe')}
            />
          }
          label="Rolling Sharpe Ratio"
        />
        <FormControlLabel
          control={
            <Switch
              checked={visibleCharts.drawdown}
              onChange={() => toggleChartVisibility('drawdown')}
            />
          }
          label="Drawdown"
        />
        <FormControlLabel
          control={
            <Switch
              checked={visibleCharts.priceSignal}
              onChange={() => toggleChartVisibility('priceSignal')}
            />
          }
          label="Price and Signals"
        />
      </FormGroup>

      {visibleCharts.equityCurve && downsampledEquityCurve.length > 0 && (
        <CollapsibleChart title={`Equity Curve - ${assetName}`}>
          <EquityCurveChart
            data={downsampledEquityCurve}
            strategies={strategies}
            assetName={assetName}
          />
        </CollapsibleChart>
      )}

      {visibleCharts.rollingSharpe && downsampledRollingSharpe.length > 0 && (
        <CollapsibleChart title={`Rolling Sharpe Ratio - ${assetName}`}>
          <RollingSharpeChart
            data={downsampledRollingSharpe}
            strategies={strategies}
            assetName={assetName}
          />
        </CollapsibleChart>
      )}

      {visibleCharts.drawdown && downsampledDrawdown.length > 0 && (
        <CollapsibleChart title={`Drawdown Chart - ${assetName}`}>
          <DrawdownChart
            data={downsampledDrawdown}
            strategies={strategies}
            assetName={assetName}
          />
        </CollapsibleChart>
      )}

      {visibleCharts.priceSignal && (
        <CollapsibleChart title={`Price and Signals - ${assetName}`}>
          <PriceSignalChart
            signals={signals} // Pass the full signals without downsampling
            assetName={assetName}
          />
        </CollapsibleChart>
      )}
    </Box>
  );
};

export default React.memo(ChartSystem);

