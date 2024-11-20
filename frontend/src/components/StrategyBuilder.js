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
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import RuleComponent from './RuleComponent';
import RegimeFilter from './RegimeFilter';

const AVAILABLE_FREQUENCIES = {
  'Yahoo Finance': ['Daily'],
  'Binance': ['Daily', '4h', '1h', '30m', '15m', '10m', '5m', '1m'],
};

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
  duplicateStrategy,
  dataSource,
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
                onClick={() => duplicateStrategy(strategyIndex)}
                color="primary"
                size="small"
              >
                <ContentCopyIcon />
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

          {/* Strategy Header and Basic Parameters */}
          <Box sx={{ mb: 2 }}>
            <Paper sx={{ p: 2 }}>
              {/* Basic Strategy Parameters */}
              <Grid container spacing={2}>
                {/* First Row - Basic Info */}
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Strategy Name"
                        placeholder="Enter strategy name"
                        value={strategy.name}
                        onChange={(e) =>
                          updateStrategy(strategyIndex, 'name', e.target.value)
                        }
                        variant="outlined"
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth variant="outlined" size="small">
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
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel>Data Frequency</InputLabel>
                        <Select
                          label="Data Frequency"
                          value={strategy.frequency || ''}
                          onChange={(e) =>
                            updateStrategy(
                              strategyIndex,
                              'frequency',
                              e.target.value
                            )
                          }
                        >
                          {AVAILABLE_FREQUENCIES[dataSource].map((freq) => (
                            <MenuItem key={freq} value={freq}>{freq}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Divider */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                {/* Position Sizing Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Position Sizing
                  </Typography>
                  
                  {/* Method Selection and Allocation */}
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Allocation"
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
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">%</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={9}>
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
                          control={<Radio size="small" />}
                          label={<Typography variant="body2">Fixed Position Size</Typography>}
                        />
                        <FormControlLabel
                          value="volatility_target"
                          control={<Radio size="small" />}
                          label={<Typography variant="body2">Volatility Target Position Sizing</Typography>}
                        />
                      </RadioGroup>
                    </Grid>
                  </Grid>

                  {/* Fixed Position Size Parameters */}
                  {strategy.position_size_method === 'fixed' && (
                    <Box sx={{ mt: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                          <TextField
                            label="Fixed Position Size"
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
                            size="small"
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">%</InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Volatility Target Parameters */}
                  {strategy.position_size_method === 'volatility_target' && (
                    <Box sx={{ mt: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                          <TextField
                            label="Volatility Target"
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
                            size="small"
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">%</InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            label="Volatility Buffer"
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
                            size="small"
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">%</InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            label="Volatility Lookback"
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
                            size="small"
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">days</InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
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
                            size="small"
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">x</InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Box>

            <RegimeFilter
              strategy={strategy}
              strategyIndex={strategyIndex}
              updateStrategy={updateStrategy}
              updateRule={updateRule}
              updateIndicatorParam={updateIndicatorParam}
              removeRule={removeRule}
              addRule={addRule}
              INDICATORS={INDICATORS}
            />

            {/* Entry Rules */}
            <Box sx={{ mt: 4 }}>
              <Paper sx={{ p: 2 }}>
                <Box 
                  onClick={() => updateStrategy(strategyIndex, 'entryRulesCollapsed', !strategy.entryRulesCollapsed)}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <Typography variant="subtitle1">
                    Entry Rules {strategy.entryRules?.length > 0 && `(${strategy.entryRules.length})`}
                  </Typography>
                  <IconButton size="small">
                    {strategy.entryRulesCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                  </IconButton>
                </Box>
                
                {/* Show summary when collapsed */}
                {strategy.entryRulesCollapsed && strategy.entryRules?.length > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {strategy.entryRules.map((rule, idx) => (
                      <span key={idx}>
                        {idx > 0 && ` ${rule.logicalOperator.toUpperCase()} `}
                        {rule.leftIndicator.type === 'simple' 
                          ? rule.leftIndicator.name 
                          : 'Custom Function'} 
                        {rule.operator} 
                        {rule.useRightIndicator 
                          ? (rule.rightIndicator.type === 'simple' 
                            ? rule.rightIndicator.name 
                            : 'Custom Function')
                          : rule.rightValue}
                      </span>
                    ))}
                  </Typography>
                )}

                <Collapse in={!strategy.entryRulesCollapsed}>
                  <Box sx={{ mt: 2 }}>
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
                </Collapse>
              </Paper>
            </Box>

            {/* Exit Rules */}
            <Box sx={{ mt: 4 }}>
              <Paper sx={{ p: 2 }}>
                <Box 
                  onClick={() => updateStrategy(strategyIndex, 'exitRulesCollapsed', !strategy.exitRulesCollapsed)}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <Typography variant="subtitle1">
                    Exit Rules {strategy.exitRules?.length > 0 && `(${strategy.exitRules.length})`}
                  </Typography>
                  <IconButton size="small">
                    {strategy.exitRulesCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                  </IconButton>
                </Box>

                {/* Show summary when collapsed */}
                {strategy.exitRulesCollapsed && strategy.exitRules?.length > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {strategy.exitRules.map((rule, idx) => (
                      <span key={idx}>
                        {idx > 0 && ` ${rule.logicalOperator.toUpperCase()} `}
                        {rule.leftIndicator.type === 'simple' 
                          ? rule.leftIndicator.name 
                          : 'Custom Function'} 
                        {rule.operator} 
                        {rule.useRightIndicator 
                          ? (rule.rightIndicator.type === 'simple' 
                            ? rule.rightIndicator.name 
                            : 'Custom Function')
                          : rule.rightValue}
                      </span>
                    ))}
                  </Typography>
                )}

                <Collapse in={!strategy.exitRulesCollapsed}>
                  <Box sx={{ mt: 2 }}>
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
