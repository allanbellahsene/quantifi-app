//QuantiFiBacktestingLab.js

import React from 'react';
import {
  TextField, 
  Typography, 
  Box, 
  InputAdornment,
  Paper,
  Divider
} from '@mui/material';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import SearchIcon from '@mui/icons-material/Search';
import PercentIcon from '@mui/icons-material/Percent';

const BacktestingParameters = ({
    asset,
    setAsset,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    fees,
    setFees,
    slippage,
    setSlippage,
  }) => {
    return (
      <Paper elevation={3} sx={{ mb: 4, p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Backtesting Parameters
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box
          component="form"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
          noValidate
          autoComplete="off"
        >
          {/* Asset Symbol */}
          <TextField
            label="Asset Symbol"
            placeholder="e.g., BTC-USD"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            variant="outlined"
            fullWidth
          />
  
          {/* Dates */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap',
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={dayjs(startDate)}
                onChange={(date) =>
                  setStartDate(date ? date.format('YYYY-MM-DD') : '')
                }
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" fullWidth />
                )}
              />
              <DatePicker
                label="End Date"
                value={dayjs(endDate)}
                onChange={(date) =>
                  setEndDate(date ? date.format('YYYY-MM-DD') : '')
                }
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" fullWidth />
                )}
              />
            </LocalizationProvider>
          </Box>
  
          {/* Fees and Slippage */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap',
            }}
          >
            <TextField
              label="Fees (%)"
              type="number"
              placeholder="e.g., 0.1"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              fullWidth
            />
            <TextField
              label="Slippage (%)"
              type="number"
              placeholder="e.g., 0.1"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              fullWidth
            />
          </Box>
        </Box>
      </Paper>
    );
  };

  export default BacktestingParameters;