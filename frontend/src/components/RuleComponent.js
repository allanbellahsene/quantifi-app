import React, { useState } from 'react';
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
  Chip,
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import FunctionBuilder from './FunctionBuilder';

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
  const [expanded, setExpanded] = useState(true);

  // Handler for right indicator updates
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

  // Format rule into readable string
  const formatRule = () => {
    const leftPart = rule.leftIndicator?.type === 'simple'
      ? `${rule.leftIndicator.name}${rule.leftIndicator.params?.window ? '(' + rule.leftIndicator.params.window + ')' : ''}`
      : 'Custom';

    const rightPart = rule.useRightIndicator
      ? (rule.rightIndicator?.type === 'simple'
          ? `${rule.rightIndicator.name}${rule.rightIndicator.params?.window ? '(' + rule.rightIndicator.params.window + ')' : ''}`
          : 'Custom')
      : rule.rightValue;

    return `${leftPart} ${rule.operator} ${rightPart}`;
  };

  // Collapsed view
  const CollapsedView = () => (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2}>
        {ruleIndex > 0 && (
          <Grid item xs={12}>
            <Chip
              size="small"
              label={rule.logicalOperator?.toUpperCase() || 'AND'}
              sx={{ 
                backgroundColor: 'grey.200',
                fontSize: '0.75rem',
                mb: 1
              }}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              backgroundColor: 'background.paper',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'grey.50'
              }
            }}
            onClick={() => setExpanded(true)}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  size="small"
                  label={formatRule()}
                  color="primary"
                  variant="outlined"
                  sx={{ '& .MuiChip-label': { fontSize: '0.75rem' } }}
                />
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRule(strategyIndex, ruleIndex, ruleType);
                  }}
                  color="error"
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(true);
                  }}
                  size="small"
                >
                  <ExpandMoreIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // Expanded view
  const ExpandedView = () => (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2} alignItems="flex-start">
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Rule {ruleIndex + 1}
              </Typography>
              <Box>
                <IconButton
                  onClick={() => setExpanded(false)}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <ExpandLessIcon />
                </IconButton>
              </Box>
            </Box>

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

  return expanded ? <ExpandedView /> : <CollapsedView />;
};

export default RuleComponent;