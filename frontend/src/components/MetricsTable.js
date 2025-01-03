import React, { useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Grid, useTheme, Accordion, AccordionSummary, AccordionDetails 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const SHOW_TRADE_METRICS = false; 

const formatValue = (value) => {
  if (value === undefined || value === null) return 'N/A';
  if (typeof value === 'number') {
    return value.toFixed(4);
  }
  return value;
};

const MetricSection = ({ title, metrics, strategies, metricsData }) => {
  const theme = useTheme();

  if (!metricsData || Object.keys(metricsData).length === 0) {
    return (
      <Typography color="error">No data available for {title}</Typography>
    );
  }

  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${title}-content`}
        id={`${title}-header`}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Metric</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Portfolio</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Benchmark</TableCell>
                {strategies.map((strategy) => (
                  <TableCell key={strategy} align="right" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>{strategy}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.map((metric) => (
                <TableRow key={metric} sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } }}>
                  <TableCell component="th" scope="row">{metric}</TableCell>
                  <TableCell align="right">{formatValue(metricsData?.Portfolio?.[metric])}</TableCell>
                  <TableCell align="right">{formatValue(metricsData?.Benchmark?.[metric])}</TableCell>
                  {strategies.map((strategy) => (
                    <TableCell key={strategy} align="right">
                      {formatValue(metricsData?.[strategy]?.[metric])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
};

const MetricsTable = ({ metrics }) => {
  useEffect(() => {
    console.log('MetricsTable - Received metrics:', metrics);
  }, [metrics]);

  if (!metrics || typeof metrics !== 'object' || Object.keys(metrics).length === 0) {
    return <Typography color="error">No metrics data available</Typography>;
  }

  const strategies = Object.keys(metrics).filter(key => key !== 'Portfolio' && key !== 'Benchmark');

  const generalMetrics = ['Start Date', 'End Date', 'Initial Value', 'End Value', 'Max Value', 'Min Value'];
  const returnMetrics = ['Total Return', 'Annualized Return', 'Volatility', 'Sharpe Ratio', 'Sortino Ratio', 'Calmar Ratio'];
  const drawdownMetrics = ['Max Drawdown', 'Average Drawdown'];
  const tradeMetrics = ['Number of Trades', 'Win Rate', 'Loss Rate', 'Average Win', 'Average Loss', 'Profit Factor', 'Exposure (%)', 'Max Consecutive Wins', 'Max Consecutive Losses', 'Average Trade Duration (days)'];
  const periodMetrics = ['Best Month', 'Worst Month'];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <MetricSection title="General Information" metrics={generalMetrics} strategies={strategies} metricsData={metrics} />
      </Grid>
      <Grid item xs={12}>
        <MetricSection title="Return Metrics" metrics={returnMetrics} strategies={strategies} metricsData={metrics} />
      </Grid>
      <Grid item xs={12}>
        <MetricSection title="Drawdown Metrics" metrics={drawdownMetrics} strategies={strategies} metricsData={metrics} />
      </Grid>
      {SHOW_TRADE_METRICS && (
      <Grid item xs={12}>
        <MetricSection title="Trade Metrics" metrics={tradeMetrics} strategies={strategies} metricsData={metrics} />
      </Grid>
      )}
      <Grid item xs={12}>
        <MetricSection title="Period Performance" metrics={periodMetrics} strategies={strategies} metricsData={metrics} />
      </Grid>
    </Grid>
  );
};

export default React.memo(MetricsTable);