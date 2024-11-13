import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, Typography, Paper, IconButton, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

const FunctionBuilder = ({ 
  initialExpression = '', 
  onChange,
  availableIndicators
}) => {
  const [stack, setStack] = useState([]);
  const [expression, setExpression] = useState(initialExpression);

  const functions = [
    { name: 'max', minParams: 2, maxParams: null },
    { name: 'min', minParams: 2, maxParams: null },
    { name: 'mean', minParams: 2, maxParams: null },
    { name: 'add', minParams: 2, maxParams: null },
    { name: 'subtract', minParams: 2, maxParams: 2 },
    { name: 'multiply', minParams: 2, maxParams: null },
    { name: 'divide', minParams: 2, maxParams: 2 }
  ];

  const generateExpression = useCallback((currentStack) => {
    let expr = '';
    let lastFunction = null;
    
    currentStack.forEach((item, index) => {
      if (item.type === 'function') {
        expr = `${item.name}(${expr}${expr ? ', ' : ''}`
        lastFunction = item;
      } else if (item.type === 'indicator') {
        const params = Object.entries(item.params)
          .map(([_, value]) => value)
          .filter(value => value !== '')
          .join(',');
        
        expr += `${item.name}(${params})`;
        
        if (lastFunction && index < currentStack.length - 1) {
          expr += ', ';
        }
      }
    });
    
    // Close any open function parentheses
    let depth = currentStack.filter(item => item.type === 'function').length;
    expr += ')'.repeat(depth);

    return expr;
  }, []);

  useEffect(() => {
    const newExpression = generateExpression(stack);
    if (newExpression !== expression) {
      setExpression(newExpression);
      onChange(newExpression);
    }
  }, [stack, generateExpression, onChange, expression]);

  const addFunction = useCallback((func) => {
    setStack(prevStack => [...prevStack, { 
      type: 'function', 
      name: func.name,
      params: [],
      minParams: func.minParams,
      maxParams: func.maxParams
    }]);
  }, []);

  const addIndicator = useCallback((indicator) => {
    setStack(prevStack => [...prevStack, { 
      type: 'indicator',
      name: indicator.name,
      params: indicator.params.reduce((acc, param) => ({
        ...acc,
        [param]: param === 'series' ? 'Close' : ''
      }), {})
    }]);
  }, []);

  const updateIndicatorParam = useCallback((index, param, value) => {
    setStack(prevStack => {
      const newStack = [...prevStack];
      if (!newStack[index].params) {
        newStack[index].params = {};
      }
      newStack[index].params[param] = value;
      return newStack;
    });
  }, []);

  const removeItem = useCallback((index) => {
    setStack(prevStack => prevStack.filter((_, i) => i !== index));
  }, []);

  return (
    <Box>
      {/* Functions Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
          Functions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {functions.map((func) => (
            <Button
              key={func.name}
              onClick={() => addFunction(func)}
              variant="outlined"
              size="small"
              sx={{
                textTransform: 'none',
                backgroundColor: 'primary.50',
                borderColor: 'primary.200',
                color: 'primary.700',
                '&:hover': {
                  backgroundColor: 'primary.100',
                  borderColor: 'primary.300',
                }
              }}
            >
              {func.name}()
            </Button>
          ))}
        </Box>
      </Box>

      {/* Indicators Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
          Indicators
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {availableIndicators.map((indicator) => (
            <Button
              key={indicator.name}
              onClick={() => addIndicator(indicator)}
              variant="outlined"
              size="small"
              sx={{
                textTransform: 'none',
                backgroundColor: 'success.50',
                borderColor: 'success.200',
                color: 'success.700',
                '&:hover': {
                  backgroundColor: 'success.100',
                  borderColor: 'success.300',
                }
              }}
            >
              {indicator.name}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Expression Stack */}
      <Box sx={{ mb: 2 }}>
        {stack.map((item, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{
              p: 1,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: 'grey.50'
            }}
          >
            <DragIndicatorIcon sx={{ color: 'text.disabled' }} />
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {item.name}
              </Typography>
              
              {item.type === 'indicator' && item.params && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {Object.entries(item.params).map(([param, value]) => (
                    <TextField
                      key={param}
                      size="small"
                      label={param}
                      value={value}
                      onChange={(e) => updateIndicatorParam(index, param, e.target.value)}
                      sx={{ width: '120px' }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            <IconButton
              size="small"
              onClick={() => removeItem(index)}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon />
            </IconButton>

            {index < stack.length - 1 && (
              <ArrowRightIcon sx={{ color: 'text.disabled' }} />
            )}
          </Paper>
        ))}
      </Box>

      {/* Expression Preview */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          backgroundColor: 'grey.50'
        }}
      >
        <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
          Generated Expression
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            wordBreak: 'break-all'
          }}
        >
          {expression}
        </Typography>
      </Paper>
    </Box>
  );
};

export default FunctionBuilder;