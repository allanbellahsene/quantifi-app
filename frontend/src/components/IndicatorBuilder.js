// IndicatorBuilder.js
import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
} from '@mui/material';

const IndicatorBuilder = ({
  indicator,
  updateIndicator,
  indicatorsList,
}) => {
  const handleTypeChange = (event) => {
    const newType = event.target.value;
    updateIndicator({
      ...indicator,
      type: newType,
      ...(newType === 'simple'
        ? { name: '', params: {}, function: undefined, expression: undefined }
        : { function: '', expression: '' }),
    });
  };

  const handleNameChange = (event) => {
    const name = event.target.value;
    const selectedIndicator = indicatorsList.find((i) => i.name === name);
    const params = selectedIndicator?.params.reduce(
      (acc, param) => ({ ...acc, [param]: '' }),
      {}
    );
    updateIndicator({ ...indicator, name, params });
  };

  const handleParamChange = (param, value) => {
    updateIndicator({
      ...indicator,
      params: { ...indicator.params, [param]: value },
    });
  };

  const handleExpressionChange = (event) => {
    updateIndicator({ ...indicator, expression: event.target.value });
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle1">Indicator Type</Typography>
          <RadioGroup
            row
            value={indicator.type}
            onChange={handleTypeChange}
          >
            <FormControlLabel
              value="simple"
              control={<Radio />}
              label="Simple Indicator"
            />
            <FormControlLabel
              value="composite"
              control={<Radio />}
              label="Composite Indicator"
            />
          </RadioGroup>
        </Grid>

        {indicator.type === 'simple' ? (
          <>
            {/* Simple Indicator Layout */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Indicator</InputLabel>
                <Select
                  value={indicator.name || ''}
                  onChange={handleNameChange}
                >
                  {indicatorsList.map((ind) => (
                    <MenuItem key={ind.name} value={ind.name}>
                      {ind.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {indicator.name &&
              indicatorsList.find((i) => i.name === indicator.name)?.params.map((param) => (
                <Grid item xs={6} md={4} key={param}>
                  <TextField
                    label={param}
                    value={indicator.params[param] || ''}
                    onChange={(e) => handleParamChange(param, e.target.value)}
                    fullWidth
                  />
                </Grid>
              ))}
          </>
        ) : (
          // Composite Indicator Layout
          <Grid item xs={12}>
            <TextField
              label="Composite Expression"
              placeholder="Enter composite expression, e.g., max(SMA(Close,20), EMA(Close,50))"
              value={indicator.expression || ''}
              onChange={handleExpressionChange}
              fullWidth
              variant="outlined"
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default IndicatorBuilder;



