import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
  Accordion, AccordionSummary, AccordionDetails, useTheme, TableSortLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import dayjs from 'dayjs';

const TradesTable = ({ trades }) => {
  const [openAllTrades, setOpenAllTrades] = useState(false);
  const [orderBy, setOrderBy] = useState('entry_date');
  const [order, setOrder] = useState('desc');
  const theme = useTheme();

  const formatDate = (dateString) => {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
  };

  const columns = [
    { id: 'strategy', label: 'Strategy', numeric: false },
    { id: 'entry_date', label: 'Entry Date', numeric: false },
    { id: 'exit_date', label: 'Exit Date', numeric: false },
    { id: 'avg_entry_price', label: 'Avg. Entry Price', numeric: true },
    { id: 'avg_exit_price', label: 'Avg. Exit Price', numeric: true },
    { id: 'position', label: 'Position', numeric: true },
    { id: 'trade_return', label: 'Trade Return', numeric: true },
    { id: 'trade_type', label: 'Trade Type', numeric: false },
  ];

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortTrades = (tradesToSort) => {
    return [...tradesToSort].sort((a, b) => {
      if (!a[orderBy] && !b[orderBy]) return 0;
      if (!a[orderBy]) return 1;
      if (!b[orderBy]) return -1;

      const aValue = columns.find(col => col.id === orderBy)?.numeric 
        ? Number(a[orderBy]) 
        : orderBy.includes('date') 
          ? new Date(a[orderBy]).getTime()
          : a[orderBy];
          
      const bValue = columns.find(col => col.id === orderBy)?.numeric 
        ? Number(b[orderBy]) 
        : orderBy.includes('date') 
          ? new Date(b[orderBy]).getTime()
          : b[orderBy];

      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    });
  };

  const renderTradeRow = (trade, index) => (
    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } }}>
      <TableCell>{trade.strategy || 'N/A'}</TableCell>
      <TableCell>{formatDate(trade.entry_date) || 'N/A'}</TableCell>
      <TableCell>{formatDate(trade.exit_date) || 'N/A'}</TableCell>
      <TableCell>{trade.avg_entry_price ? trade.avg_entry_price.toFixed(2) : 'N/A'}</TableCell>
      <TableCell>{trade.avg_exit_price ? trade.avg_exit_price.toFixed(2) : 'N/A'}</TableCell>
      <TableCell>{trade.position ? trade.position.toFixed(4) : 'N/A'}</TableCell>
      <TableCell>{trade.trade_return ? (trade.trade_return * 100).toFixed(2) + '%' : 'N/A'}</TableCell>
      <TableCell>{trade.trade_type || 'N/A'}</TableCell>
    </TableRow>
  );

  const renderTableHeader = () => (
    <TableHead>
      <TableRow>
        {columns.map((column) => (
          <TableCell 
            key={column.id}
            sx={{ 
              fontWeight: 'bold', 
              backgroundColor: theme.palette.primary.main, 
              color: theme.palette.common.white 
            }}
          >
            <TableSortLabel
              active={orderBy === column.id}
              direction={orderBy === column.id ? order : 'asc'}
              onClick={() => handleRequestSort(column.id)}
              sx={{
                '&.MuiTableSortLabel-root': {
                  color: theme.palette.common.white,
                },
                '&.MuiTableSortLabel-root:hover': {
                  color: theme.palette.common.white,
                },
                '&.MuiTableSortLabel-root.Mui-active': {
                  color: theme.palette.common.white,
                },
                '& .MuiTableSortLabel-icon': {
                  color: `${theme.palette.common.white} !important`,
                },
              }}
            >
              {column.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  const sortedTrades = sortTrades(trades);
  const displayedTrades = sortedTrades.slice(0, 10);

  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="trade-history-content"
        id="trade-history-header"
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Trade History</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="small" aria-label="trades table">
            {renderTableHeader()}
            <TableBody>
              {displayedTrades.map(renderTradeRow)}
            </TableBody>
          </Table>
        </TableContainer>
        
        {trades.length > 10 && (
          <Button onClick={() => setOpenAllTrades(true)} sx={{ mt: 2 }}>
            View All Trades
          </Button>
        )}

        <Dialog open={openAllTrades} onClose={() => setOpenAllTrades(false)} maxWidth="lg" fullWidth>
          <DialogTitle>All Trades History</DialogTitle>
          <DialogContent>
            <TableContainer component={Paper} style={{ maxHeight: 400, overflow: 'auto' }}>
              <Table stickyHeader size="small" aria-label="all trades table">
                {renderTableHeader()}
                <TableBody>
                  {sortedTrades.map(renderTradeRow)}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>
      </AccordionDetails>
    </Accordion>
  );
};

export default React.memo(TradesTable);