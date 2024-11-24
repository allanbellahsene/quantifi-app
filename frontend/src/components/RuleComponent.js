import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Paper,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import FunctionBuilder from './FunctionBuilder';

// In RuleComponent.js, modify the IndicatorSection component:

const IndicatorSection = ({
  side,
  indicator,
  updateRule,
  updateIndicatorParam,
  strategyIndex,
  ruleIndex,
  ruleType,
  indicators,
  onIndicatorSelect
}) => {
  const handleTypeChange = (type) => {
    updateRule(
      strategyIndex,
      ruleIndex,
      ruleType,
      `${side}IndicatorType`,
      type
    );

    // Reset appropriate fields based on type
    if (type === 'simple') {
      updateRule(
        strategyIndex,
        ruleIndex,
        ruleType,
        `${side}IndicatorExpression`,
        ''
      );
    } else {
      updateRule(
        strategyIndex,
        ruleIndex,
        ruleType,
        `${side}IndicatorName`,
        ''
      );
    }

    // Always ensure useRightIndicator is true when on right side
    if (side === 'right') {
      updateRule(
        strategyIndex,
        ruleIndex,
        ruleType,
        'useRightIndicator',
        true
      );
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {side.charAt(0).toUpperCase() + side.slice(1)} Side
      </Typography>
      
      {/* Indicator Type Toggle */}
      <RadioGroup
        row
        value={indicator?.type || 'simple'}
        onChange={(e) => handleTypeChange(e.target.value)}
      >
        <FormControlLabel 
          value="simple" 
          control={<Radio size="small" />} 
          label="Simple" 
        />
        <FormControlLabel 
          value="composite" 
          control={<Radio size="small" />} 
          label="Composite" 
        />
      </RadioGroup>

      {indicator?.type === 'simple' ? (
        <>
          <FormControl fullWidth variant="outlined" size="small" sx={{ mt: 1 }}>
            <InputLabel>Indicator</InputLabel>
            <Select
              label="Indicator"
              value={indicator?.name || ''}
              onChange={onIndicatorSelect || ((e) =>
                updateRule(
                  strategyIndex,
                  ruleIndex,
                  ruleType,
                  `${side}IndicatorName`,
                  e.target.value
                )
              )}
            >
              {indicators.map((ind) => (
                <MenuItem key={ind.name} value={ind.name}>
                  {ind.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {indicator?.name && indicators
            .find((i) => i.name === indicator.name)
            ?.params.map((param) => (
              <TextField
                key={param}
                label={param}
                size="small"
                value={indicator?.params?.[param] || (param === 'series' ? 'Close' : '')}
                onChange={(e) =>
                  updateIndicatorParam(
                    strategyIndex,
                    ruleIndex,
                    ruleType,
                    side,
                    param,
                    e.target.value
                  )
                }
                variant="outlined"
                fullWidth
                sx={{ mt: 1 }}
              />
            ))}
        </>
      ) : (
        <Box sx={{ mt: 1 }}>
          <FunctionBuilder
            initialExpression={indicator?.expression || ''}
            onChange={(expression) =>
              updateRule(
                strategyIndex,
                ruleIndex,
                ruleType,
                `${side}IndicatorExpression`,
                expression
              )
            }
            availableIndicators={indicators}
          />
        </Box>
      )}
    </Paper>
  );
};

const RuleComponent = ({
  rule,
  ruleIndex,
  strategyIndex,
  ruleType,
  updateRule,
  updateIndicatorParam,
  removeRule,
  indicators,
}) => {
  // Handler for when right indicator is updated
  const handleRightIndicatorUpdate = (e) => {
    const indicatorName = e.target.value;
    updateRule(
      strategyIndex,
      ruleIndex,
      ruleType,
      'rightIndicatorName',
      indicatorName
    );
    
    updateRule(
      strategyIndex,
      ruleIndex,
      ruleType,
      'useRightIndicator',
      true
    );

    const selectedIndicator = indicators.find(i => i.name === indicatorName);
    if (selectedIndicator?.params.includes('series')) {
      updateIndicatorParam(
        strategyIndex,
        ruleIndex,
        ruleType,
        'right',
        'series',
        'Close'
      );
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2} alignItems="flex-start">
        {/* Logical Operator (for rules after the first one) */}
        {ruleIndex > 0 && (
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Logic</InputLabel>
              <Select
                label="Logic"
                value={rule.logicalOperator || 'and'}
                onChange={(e) =>
                  updateRule(
                    strategyIndex,
                    ruleIndex,
                    ruleType,
                    'logicalOperator',
                    e.target.value
                  )
                }
              >
                <MenuItem value="and">AND</MenuItem>
                <MenuItem value="or">OR</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2, backgroundColor: 'background.paper' }}>
            <Grid container spacing={2} alignItems="flex-start">
              {/* Left Side */}
              <Grid item xs={12} md={5}>
                <IndicatorSection
                  side="left"
                  indicator={rule.leftIndicator}
                  updateRule={updateRule}
                  updateIndicatorParam={updateIndicatorParam}
                  strategyIndex={strategyIndex}
                  ruleIndex={ruleIndex}
                  ruleType={ruleType}
                  indicators={indicators}
                />
              </Grid>

              {/* Operator */}
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '100px' }}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Operator</InputLabel>
                    <Select
                      label="Operator"
                      value={rule.operator || '<'}
                      onChange={(e) =>
                        updateRule(
                          strategyIndex,
                          ruleIndex,
                          ruleType,
                          'operator',
                          e.target.value
                        )
                      }
                    >
                      {['<', '<=', '>', '>=', '==', '!='].map((op) => (
                        <MenuItem key={op} value={op}>
                          {op}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Right Side */}
              <Grid item xs={12} md={5}>
                <IndicatorSection
                  side="right"
                  indicator={rule.rightIndicator}
                  updateRule={updateRule}
                  updateIndicatorParam={updateIndicatorParam}
                  strategyIndex={strategyIndex}
                  ruleIndex={ruleIndex}
                  ruleType={ruleType}
                  indicators={indicators}
                  onIndicatorSelect={handleRightIndicatorUpdate}
                />
              </Grid>
            </Grid>

            {/* Delete Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <IconButton
                onClick={() => removeRule(strategyIndex, ruleIndex, ruleType)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RuleComponent;