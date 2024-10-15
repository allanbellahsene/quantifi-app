import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
  Accordion, AccordionSummary, AccordionDetails, useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import dayjs from 'dayjs';

const TradesTable = ({ trades }) => {
  const [openAllTrades, setOpenAllTrades] = useState(false);
  const displayedTrades = trades.slice(0, 10);
  const theme = useTheme();

  const formatDate = (dateString) => {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
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
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Strategy</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Entry Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Exit Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Avg. Entry Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Avg. Exit Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Position</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Trade Return</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Trade Type</TableCell>
              </TableRow>
            </TableHead>
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
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Strategy</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Entry Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Exit Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Avg. Entry Price</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Avg. Exit Price</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Position</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Trade Return</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Trade Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trades.map(renderTradeRow)}
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