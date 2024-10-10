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
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import RuleComponent from './RuleComponent'; 

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
          <IconButton
            onClick={() => deleteStrategy(strategyIndex)}
            color="error"
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <DeleteIcon />
          </IconButton>

          {/* Strategy Details */}
          <Typography variant="h6" gutterBottom>
            Strategy {strategyIndex + 1}
          </Typography>
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
