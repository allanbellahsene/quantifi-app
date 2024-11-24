import React, { useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Paper,
  Collapse,
  Chip,
} from '@mui/material';
import { Add as AddIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import RuleComponent from './RuleComponent';

const RegimeFilter = ({
  strategy,
  strategyIndex,
  updateStrategy,
  updateRule,
  updateIndicatorParam,
  removeRule,
  addRule,
  INDICATORS
}) => {
  const [expanded, setExpanded] = useState(false);
  const addEntryRegimeRule = () => addRule(strategyIndex, 'entryRegimeRules');
  const addExitRegimeRule = () => addRule(strategyIndex, 'exitRegimeRules');
  
    // Format rule into readable string
    const formatRule = (rule) => {
      const leftPart = rule.leftIndicator.type === 'simple' 
        ? rule.leftIndicator.name
        : 'Custom';
      
      const rightPart = rule.useRightIndicator 
        ? (rule.rightIndicator.type === 'simple' 
            ? `${rule.rightIndicator.name}(${rule.rightIndicator.params?.window || ''})`
            : 'Custom')
        : rule.rightValue;
  
      return `${leftPart} ${rule.operator} ${rightPart}`;
    };
  
    // Helper function to display rules in summary
    const getRulesSummary = (rules, type) => {
      if (!rules || rules.length === 0) return null;
  
      return (
        <Box sx={{ ml: 3, mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {rules.map((rule, index) => (
            <Chip
              key={index}
              size="small"
              label={formatRule(rule)}
              variant="outlined"
              color={type === 'entry' ? 'info' : 'warning'}
              sx={{ 
                '& .MuiChip-label': {
                  fontSize: '0.75rem',
                }
              }}
            />
          ))}
        </Box>
      );
    };
    
    // Helper function to summarize regime rules
    const getRegimeSummary = () => {
      const hasRegimeFilter = strategy.regimeAsset || 
                            strategy.regimeEntryAction || 
                            strategy.regimeExitAction;
  
      if (!hasRegimeFilter) {
        return null;
      }
  
      return (
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {strategy.regimeAsset && (
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                Asset:
              </Typography>
              <Chip 
                size="small" 
                label={strategy.regimeAsset}
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
  
          {strategy.regimeEntryAction && (
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  Entry Control:
                </Typography>
                <Chip 
                  size="small" 
                  label={`Allow ${strategy.regimeEntryAction} entries only`}
                  color="info"
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({strategy.entryRegimeRules?.length || 0} {strategy.entryRegimeRules?.length === 1 ? 'rule' : 'rules'})
                </Typography>
              </Box>
              {getRulesSummary(strategy.entryRegimeRules, 'entry')}
            </Box>
          )}
  
          {strategy.regimeExitAction && (
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  Exit Control:
                </Typography>
                <Chip 
                  size="small" 
                  label={`Exit ${strategy.regimeExitAction} positions`}
                  color="warning"
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({strategy.exitRegimeRules?.length || 0} {strategy.exitRegimeRules?.length === 1 ? 'rule' : 'rules'})
                </Typography>
              </Box>
              {getRulesSummary(strategy.exitRegimeRules, 'exit')}
            </Box>
          )}
        </Box>
      );
    };
  
  return (
    <Box sx={{ mt: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1" gutterBottom>
          Regime Filter
        </Typography>
        <IconButton onClick={() => setExpanded(!expanded)} size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {/* Show summary when collapsed */}
      {!expanded && getRegimeSummary()}

      {/* Main content when expanded */}
      <Collapse in={expanded}>
        {/* Regime Filter Asset */}
        <TextField
          label="Regime Filter Asset"
          placeholder="e.g., BTC-USD"
          value={strategy.regimeAsset || ''}
          onChange={(e) => updateStrategy(strategyIndex, 'regimeAsset', e.target.value)}
          variant="outlined"
          fullWidth
          sx={{ mb: 3 }}
          helperText="Asset to base the regime filter on (e.g., BTC-USD)"
        />

        {/* Entry Regime Rules */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Entry Regime Rules
          </Typography>
          
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>When Rules Are True, Allow Only</InputLabel>
            <Select
              label="When Rules Are True, Allow Only"
              value={strategy.regimeEntryAction || ''}
              onChange={(e) => updateStrategy(strategyIndex, 'regimeEntryAction', e.target.value || null)}
            >
              <MenuItem value="">No Entry Control</MenuItem>
              <MenuItem value="long">Long Entries</MenuItem>
              <MenuItem value="short">Short Entries</MenuItem>
            </Select>
          </FormControl>

          {strategy.regimeEntryAction && (
            <>
              {strategy.entryRegimeRules && strategy.entryRegimeRules.map((rule, ruleIndex) => (
                <RuleComponent
                  key={ruleIndex}
                  rule={rule}
                  ruleIndex={ruleIndex}
                  strategyIndex={strategyIndex}
                  ruleType="entryRegimeRules"
                  updateRule={updateRule}
                  updateIndicatorParam={updateIndicatorParam}
                  removeRule={removeRule}
                  indicators={INDICATORS}
                />
              ))}

              <Button
                onClick={addEntryRegimeRule}
                startIcon={<AddIcon />}
                variant="outlined"
                sx={{ mt: 2 }}
              >
                Add Entry Regime Rule
              </Button>
            </>
          )}
        </Paper>

        {/* Exit Regime Rules */}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Exit Regime Rules
          </Typography>
          
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>When Rules Are True, Exit All</InputLabel>
            <Select
              label="When Rules Are True, Exit All"
              value={strategy.regimeExitAction || ''}
              onChange={(e) => updateStrategy(strategyIndex, 'regimeExitAction', e.target.value || null)}
            >
              <MenuItem value="">No Exit Control</MenuItem>
              <MenuItem value="long">Long Positions</MenuItem>
              <MenuItem value="short">Short Positions</MenuItem>
            </Select>
          </FormControl>

          {strategy.regimeExitAction && (
            <>
              {strategy.exitRegimeRules && strategy.exitRegimeRules.map((rule, ruleIndex) => (
                <RuleComponent
                  key={ruleIndex}
                  rule={rule}
                  ruleIndex={ruleIndex}
                  strategyIndex={strategyIndex}
                  ruleType="exitRegimeRules"  
                  updateRule={updateRule}
                  updateIndicatorParam={updateIndicatorParam}
                  removeRule={removeRule}
                  indicators={INDICATORS}
                />
              ))}

              <Button
                onClick={addExitRegimeRule}
                startIcon={<AddIcon />}
                variant="outlined"
                sx={{ mt: 2 }}
              >
                Add Exit Regime Rule
              </Button>
            </>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
};

export default RegimeFilter;
