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

const IndicatorSection = ({ side, indicator, updateRule, updateIndicatorParam, strategyIndex, ruleIndex, ruleType, indicators }) => (
  <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      {side} Side
    </Typography>
    
    <RadioGroup
      row
      value={indicator?.type || 'simple'}
      onChange={(e) =>
        updateRule(
          strategyIndex,
          ruleIndex,
          ruleType,
          `${side.toLowerCase()}IndicatorType`,
          e.target.value
        )
      }
    >
      <FormControlLabel value="simple" control={<Radio size="small" />} label="Simple" />
      <FormControlLabel value="composite" control={<Radio size="small" />} label="Composite" />
    </RadioGroup>

    {indicator?.type === 'simple' ? (
      <>
        <FormControl fullWidth variant="outlined" size="small" sx={{ mt: 1 }}>
          <InputLabel>Indicator</InputLabel>
          <Select
            label="Indicator"
            value={indicator?.name || ''}
            onChange={(e) => {
              updateRule(
                strategyIndex,
                ruleIndex,
                ruleType,
                `${side.toLowerCase()}IndicatorName`,
                e.target.value
              );
              // Set default series parameter if needed
              const selectedIndicator = indicators.find(i => i.name === e.target.value);
              if (selectedIndicator?.params.includes('series')) {
                updateIndicatorParam(
                  strategyIndex,
                  ruleIndex,
                  ruleType,
                  side.toLowerCase(),
                  'series',
                  'Close'
                );
              }
            }}
          >
            {indicators.map((ind) => (
              <MenuItem key={ind.name} value={ind.name}>
                {ind.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {indicator?.name &&
          indicators
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
                    side.toLowerCase(),
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
      <TextField
        label="Composite Expression"
        size="small"
        placeholder="e.g., max(SMA(Close,20), EMA(Close,50))"
        value={indicator?.expression || ''}
        onChange={(e) =>
          updateRule(
            strategyIndex,
            ruleIndex,
            ruleType,
            `${side.toLowerCase()}IndicatorExpression`,
            e.target.value
          )
        }
        variant="outlined"
        fullWidth
        sx={{ mt: 1 }}
        helperText="Use functions: max, min, mean, add, subtract, multiply, divide"
      />
    )}
  </Paper>
);

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
  if (!rule) return null;

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

        {/* Rule Components */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2, backgroundColor: 'background.paper' }}>
            <Grid container spacing={2} alignItems="flex-start">
              {/* Left Indicator */}
              <Grid item xs={12} md={5}>
                <IndicatorSection
                  side="Left"
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

              {/* Right Indicator */}
              <Grid item xs={12} md={5}>
                <IndicatorSection
                  side="Right"
                  indicator={rule.rightIndicator}
                  updateRule={updateRule}
                  updateIndicatorParam={updateIndicatorParam}
                  strategyIndex={strategyIndex}
                  ruleIndex={ruleIndex}
                  ruleType={ruleType}
                  indicators={indicators}
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


