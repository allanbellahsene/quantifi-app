// StrategyBuilder.js
import React from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Grid,
  IconButton,
  Button,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import RuleComponent from './RuleComponent'; 
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import Collapse from '@mui/material/Collapse';


const StrategyBuilder = ({
  strategies,
  setStrategies,
  INDICATORS,
  updateStrategy,
  addStrategy,
  deleteStrategy,
  updateRule,
  updateIndicatorParam,
  removeRule,
  addRule,
  toggleStrategyCollapse,
}) => {
  return (
    <Paper elevation={3} sx={{ mb: 4, p: 4, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>
        Strategy Builder
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {strategies.map((strategy, strategyIndex) => (
        <Paper
          key={strategyIndex}
          elevation={2}
          sx={{ p: 3, mb: 4, position: 'relative' }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" gutterBottom>
              Strategy {strategyIndex + 1}: {strategy.name}
            </Typography>
            <Box>
              <IconButton
                onClick={() => toggleStrategyCollapse(strategyIndex)}
                size="small"
              >
                {strategy.collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
              <IconButton
                onClick={() => deleteStrategy(strategyIndex)}
                color="error"
                size="small"
              >
              <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          <Collapse in={!strategy.collapsed}>
            {/* Strategy Details */}
            <Grid container spacing={3} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Strategy Name"
                    placeholder="Enter strategy name"
                    value={strategy.name}
                    onChange={(e) =>
                      updateStrategy(strategyIndex, 'name', e.target.value)
                    }
                    variant="outlined"
                    fullWidth
                  />
                </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Allocation (%)"
                  type="number"
                  placeholder="e.g., 100"
                  value={strategy.allocation}
                  onChange={(e) =>
                    updateStrategy(
                      strategyIndex,
                      'allocation',
                      parseFloat(e.target.value)
                    )
                  }
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Position Type</InputLabel>
                  <Select
                    label="Position Type"
                    value={strategy.positionType}
                    onChange={(e) =>
                      updateStrategy(
                        strategyIndex,
                        'positionType',
                        e.target.value
                      )
                    }
                  >
                    <MenuItem value="long">Long</MenuItem>
                    <MenuItem value="short">Short</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            {/* Position Sizing Method */}
            <Box sx={{ mt: 2 }}>
              <FormControl component="fieldset">
                <Typography variant="subtitle1" gutterBottom>
                  Position Sizing Method
                </Typography>
                <RadioGroup
                  row
                  value={strategy.position_size_method}
                  onChange={(e) =>
                    updateStrategy(
                      strategyIndex,
                      'position_size_method',
                      e.target.value
                    )
                  }
                >
                  <FormControlLabel
                    value="fixed"
                    control={<Radio />}
                    label="Fixed Position Size"
                  />
                  <FormControlLabel
                    value="volatility_target"
                    control={<Radio />}
                    label="Volatility Target Position Sizing"
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* Fixed Position Size Input */}
            {strategy.position_size_method === 'fixed' && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Fixed Position Size (%)"
                      type="number"
                      placeholder="e.g., 100"
                      value={strategy.fixed_position_size * 100}
                      onChange={(e) =>
                        updateStrategy(
                          strategyIndex,
                          'fixed_position_size',
                          parseFloat(e.target.value) / 100
                        )
                      }
                      variant="outlined"
                      fullWidth
                      InputProps={{
                        endAdornment: '%',
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Volatility Target Inputs */}
            {strategy.position_size_method === 'volatility_target' && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Volatility Target (%)"
                      type="number"
                      placeholder="e.g., 10"
                      value={strategy.volatility_target || ''}
                      onChange={(e) =>
                        updateStrategy(
                          strategyIndex,
                          'volatility_target',
                          parseFloat(e.target.value)
                        )
                      }
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Volatility Buffer (%)"
                      type="number"
                      placeholder="e.g., 5"
                      value={strategy.volatility_buffer || ''}
                      onChange={(e) =>
                        updateStrategy(
                          strategyIndex,
                          'volatility_buffer',
                          parseFloat(e.target.value)
                        )
                      }
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Max Leverage"
                      type="number"
                      placeholder="e.g., 3"
                      value={strategy.max_leverage || ''}
                      onChange={(e) =>
                        updateStrategy(
                          strategyIndex,
                          'max_leverage',
                          parseFloat(e.target.value)
                        )
                      }
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Volatility Lookback Period"
                      type="number"
                      placeholder="e.g., 30"
                      value={strategy.volatility_lookback || ''}
                      onChange={(e) =>
                        updateStrategy(
                          strategyIndex,
                          'volatility_lookback',
                          parseInt(e.target.value, 10)
                        )
                      }
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Entry Rules */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Entry Rules
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {strategy.entryRules &&
                strategy.entryRules.map((rule, ruleIndex) => (
                  <RuleComponent
                    key={ruleIndex}
                    rule={rule}
                    ruleIndex={ruleIndex}
                    strategyIndex={strategyIndex}
                    ruleType="entryRules"
                    updateRule={updateRule}
                    updateIndicatorParam={updateIndicatorParam}
                    removeRule={removeRule}
                    indicators={INDICATORS}
                  />
                ))}
              <Button
                onClick={() => addRule(strategyIndex, 'entryRules')}
                startIcon={<AddIcon />}
                variant="outlined"
                sx={{ mt: 2 }}
              >
                Add Entry Rule
              </Button>
            </Box>

            {/* Exit Rules */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Exit Rules
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {strategy.exitRules &&
                strategy.exitRules.map((rule, ruleIndex) => (
                  <RuleComponent
                    key={ruleIndex}
                    rule={rule}
                    ruleIndex={ruleIndex}
                    strategyIndex={strategyIndex}
                    ruleType="exitRules"
                    updateRule={updateRule}
                    updateIndicatorParam={updateIndicatorParam}
                    removeRule={removeRule}
                    indicators={INDICATORS}
                  />
                ))}
              <Button
                onClick={() => addRule(strategyIndex, 'exitRules')}
                startIcon={<AddIcon />}
                variant="outlined"
                sx={{ mt: 2 }}
              >
                Add Exit Rule
              </Button>
            </Box>
          </Collapse>
        </Paper>
      ))}

      <Button
        onClick={addStrategy}
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
      >
        Add Strategy
      </Button>
    </Paper>
  );
};

export default StrategyBuilder;
