// RuleComponent.js

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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

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
  if (!rule) {
    console.error('Rule is undefined:', { ruleIndex, strategyIndex, ruleType });
    return null;
  }

  return (
    <Box
      sx={{
        p: 2,
        mb: 2,
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 1,
        backgroundColor: 'grey.50',
      }}
    >
      <Grid container spacing={2} alignItems="center">
        {ruleIndex > 0 && (
          <Grid item xs={12} md={2}>
            <FormControl fullWidth variant="outlined">
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
                {['and', 'or'].map((op) => (
                  <MenuItem key={op} value={op}>
                    {op.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} md={ruleIndex > 0 ? 10 : 12}>
          <Grid container spacing={2} alignItems="center">
            {/* Left Indicator */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Left Indicator</InputLabel>
                <Select
                  label="Left Indicator"
                  value={rule.leftIndicator || ''}
                  onChange={(e) =>
                    updateRule(
                      strategyIndex,
                      ruleIndex,
                      ruleType,
                      'leftIndicator',
                      e.target.value
                    )
                  }
                >
                  {indicators.map((indicator) => (
                    <MenuItem key={indicator.name} value={indicator.name}>
                      {indicator.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Left Indicator Params */}
            {rule.leftIndicator &&
              indicators
                .find((i) => i.name === rule.leftIndicator)
                ?.params.map((param) => (
                  <Grid item xs={12} md={2} key={param}>
                    <TextField
                      label={param}
                      value={rule.leftParams?.[param] || ''}
                      onChange={(e) =>
                        updateIndicatorParam(
                          strategyIndex,
                          ruleIndex,
                          ruleType,
                          'left',
                          param,
                          e.target.value
                        )
                      }
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>
                ))}
            {/* Operator */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth variant="outlined">
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
            </Grid>
            {/* Right Indicator Switch */}
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={rule.useRightIndicator || false}
                    onChange={(e) =>
                      updateRule(
                        strategyIndex,
                        ruleIndex,
                        ruleType,
                        'useRightIndicator',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Use Indicator"
              />
            </Grid>
            {/* Right Indicator or Value */}
            {rule.useRightIndicator ? (
              <>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Right Indicator</InputLabel>
                    <Select
                      label="Right Indicator"
                      value={rule.rightIndicator || ''}
                      onChange={(e) =>
                        updateRule(
                          strategyIndex,
                          ruleIndex,
                          ruleType,
                          'rightIndicator',
                          e.target.value
                        )
                      }
                    >
                      {indicators.map((indicator) => (
                        <MenuItem key={indicator.name} value={indicator.name}>
                          {indicator.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {rule.rightIndicator &&
                  indicators
                    .find((i) => i.name === rule.rightIndicator)
                    ?.params.map((param) => (
                      <Grid item xs={12} md={2} key={param}>
                        <TextField
                          label={param}
                          value={rule.rightParams?.[param] || ''}
                          onChange={(e) =>
                            updateIndicatorParam(
                              strategyIndex,
                              ruleIndex,
                              ruleType,
                              'right',
                              param,
                              e.target.value
                            )
                          }
                          variant="outlined"
                          fullWidth
                        />
                      </Grid>
                    ))}
              </>
            ) : (
              <Grid item xs={12} md={2}>
                <TextField
                  label="Value"
                  value={rule.rightValue || ''}
                  onChange={(e) =>
                    updateRule(
                      strategyIndex,
                      ruleIndex,
                      ruleType,
                      'rightValue',
                      e.target.value
                    )
                  }
                  variant="outlined"
                  fullWidth
                />
              </Grid>
            )}
            {/* Delete Rule Button */}
            <Grid item xs={12} md="auto">
              <IconButton
                onClick={() =>
                  removeRule(strategyIndex, ruleIndex, ruleType)
                }
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RuleComponent;
