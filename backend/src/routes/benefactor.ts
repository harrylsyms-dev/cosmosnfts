import { Router, Request, Response } from 'express';
import { benefactorService } from '../services/benefactor.service';

const router = Router();

// ============================================
// PUBLIC ROUTES (Total Donated Widget)
// ============================================

// GET /api/benefactor/total-donated - Public endpoint for website widget
router.get('/total-donated', async (req: Request, res: Response) => {
  try {
    const data = await benefactorService.getTotalDonated();
    res.json(data);
  } catch (error) {
    console.error('Failed to get total donated:', error);
    res.status(500).json({ error: 'Failed to fetch donation data' });
  }
});

// GET /api/benefactor/eth-price - Public endpoint for current ETH price
router.get('/eth-price', async (req: Request, res: Response) => {
  try {
    const price = await benefactorService.getCurrentEthPrice();
    res.json({
      price,
      formatted: `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get ETH price:', error);
    res.status(500).json({ error: 'Failed to fetch ETH price' });
  }
});

// ============================================
// ADMIN ROUTES - Settings
// ============================================

// GET /api/benefactor/admin/settings
router.get('/admin/settings', async (req: Request, res: Response) => {
  try {
    const settings = await benefactorService.getBenefactorSettings();
    res.json(settings);
  } catch (error) {
    console.error('Failed to get benefactor settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/benefactor/admin/settings
router.put('/admin/settings', async (req: Request, res: Response) => {
  try {
    const settings = await benefactorService.updateBenefactorSettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error('Failed to update benefactor settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ============================================
// ADMIN ROUTES - Payment Methods
// ============================================

// GET /api/benefactor/admin/payment-methods
router.get('/admin/payment-methods', async (req: Request, res: Response) => {
  try {
    const methods = await benefactorService.getPaymentMethods();
    res.json({ methods });
  } catch (error) {
    console.error('Failed to get payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// POST /api/benefactor/admin/payment-methods
router.post('/admin/payment-methods', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const method = await benefactorService.createPaymentMethod(name, description);
    res.json(method);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Payment method already exists' });
    }
    console.error('Failed to create payment method:', error);
    res.status(500).json({ error: 'Failed to create payment method' });
  }
});

// DELETE /api/benefactor/admin/payment-methods/:id
router.delete('/admin/payment-methods/:id', async (req: Request, res: Response) => {
  try {
    await benefactorService.deletePaymentMethod(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// PUT /api/benefactor/admin/payment-methods/:id/default
router.put('/admin/payment-methods/:id/default', async (req: Request, res: Response) => {
  try {
    const method = await benefactorService.setDefaultPaymentMethod(req.params.id);
    res.json(method);
  } catch (error) {
    console.error('Failed to set default payment method:', error);
    res.status(500).json({ error: 'Failed to set default' });
  }
});

// ============================================
// ADMIN ROUTES - Manual Payments (System 1)
// ============================================

// GET /api/benefactor/admin/payments/current - Get current month payment status
router.get('/admin/payments/current', async (req: Request, res: Response) => {
  try {
    const payment = await benefactorService.getCurrentMonthPayment();
    const reminder = await benefactorService.checkAndCreateReminder();
    res.json({ payment, reminder });
  } catch (error) {
    console.error('Failed to get current payment:', error);
    res.status(500).json({ error: 'Failed to fetch current payment' });
  }
});

// GET /api/benefactor/admin/payments/unpaid - Get all unpaid payments
router.get('/admin/payments/unpaid', async (req: Request, res: Response) => {
  try {
    const payments = await benefactorService.getUnpaidPayments();
    res.json({ payments });
  } catch (error) {
    console.error('Failed to get unpaid payments:', error);
    res.status(500).json({ error: 'Failed to fetch unpaid payments' });
  }
});

// GET /api/benefactor/admin/payments/history - Get payment history
router.get('/admin/payments/history', async (req: Request, res: Response) => {
  try {
    const { year, status } = req.query;
    const payments = await benefactorService.getPaymentHistory({
      year: year ? parseInt(year as string) : undefined,
      status: status as string,
    });
    res.json({ payments });
  } catch (error) {
    console.error('Failed to get payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// GET /api/benefactor/admin/payments/calculate/:month/:year - Calculate monthly owed
router.get('/admin/payments/calculate/:month/:year', async (req: Request, res: Response) => {
  try {
    const month = parseInt(req.params.month);
    const year = parseInt(req.params.year);

    if (month < 1 || month > 12 || year < 2020) {
      return res.status(400).json({ error: 'Invalid month or year' });
    }

    const calculation = await benefactorService.calculateMonthlyOwed(month, year);
    res.json(calculation);
  } catch (error) {
    console.error('Failed to calculate monthly owed:', error);
    res.status(500).json({ error: 'Failed to calculate' });
  }
});

// POST /api/benefactor/admin/payments/:id/pay - Mark payment as paid
router.post('/admin/payments/:id/pay', async (req: Request, res: Response) => {
  try {
    const { paymentMethodId, paymentMethodName, referenceNumber, notes } = req.body;

    if (!paymentMethodName) {
      return res.status(400).json({ error: 'Payment method name is required' });
    }

    const payment = await benefactorService.markPaymentAsPaid(req.params.id, {
      paymentMethodId,
      paymentMethodName,
      referenceNumber,
      notes,
    });

    res.json(payment);
  } catch (error) {
    console.error('Failed to mark payment as paid:', error);
    res.status(500).json({ error: 'Failed to mark as paid' });
  }
});

// POST /api/benefactor/admin/payments/:id/refresh - Refresh payment amounts
router.post('/admin/payments/:id/refresh', async (req: Request, res: Response) => {
  try {
    const payment = await benefactorService.refreshPaymentAmounts(req.params.id);
    res.json(payment);
  } catch (error) {
    console.error('Failed to refresh payment:', error);
    res.status(500).json({ error: 'Failed to refresh payment' });
  }
});

// POST /api/benefactor/admin/payments/:id/snooze - Snooze reminder
router.post('/admin/payments/:id/snooze', async (req: Request, res: Response) => {
  try {
    const result = await benefactorService.snoozeReminder(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Failed to snooze reminder:', error);
    res.status(500).json({ error: 'Failed to snooze' });
  }
});

// GET /api/benefactor/admin/payments/export - Export payment history CSV
router.get('/admin/payments/export', async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const csv = await benefactorService.exportPaymentHistoryCSV(
      year ? parseInt(year as string) : undefined
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="benefactor-payments-${year || 'all'}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Failed to export payments:', error);
    res.status(500).json({ error: 'Failed to export' });
  }
});

// ============================================
// ADMIN ROUTES - Smart Contract Payments (System 2)
// ============================================

// GET /api/benefactor/admin/crypto/status - Smart contract status
router.get('/admin/crypto/status', async (req: Request, res: Response) => {
  try {
    const status = await benefactorService.getSmartContractStatus();
    res.json(status);
  } catch (error) {
    console.error('Failed to get crypto status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// GET /api/benefactor/admin/crypto/payments - Get all crypto payments
router.get('/admin/crypto/payments', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, transactionType } = req.query;

    const payments = await benefactorService.getSmartContractPayments({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      transactionType: transactionType as string,
    });

    res.json({ payments });
  } catch (error) {
    console.error('Failed to get crypto payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/benefactor/admin/crypto/payments/monthly - Get payments grouped by month
router.get('/admin/crypto/payments/monthly', async (req: Request, res: Response) => {
  try {
    const monthlyData = await benefactorService.getSmartContractPaymentsByMonth();
    res.json({ months: monthlyData });
  } catch (error) {
    console.error('Failed to get monthly crypto payments:', error);
    res.status(500).json({ error: 'Failed to fetch monthly data' });
  }
});

// POST /api/benefactor/admin/crypto/payments - Record a new crypto payment (webhook/manual)
router.post('/admin/crypto/payments', async (req: Request, res: Response) => {
  try {
    const {
      transactionType,
      ethAmount,
      tokenId,
      nftName,
      auctionId,
      tradeId,
      fromWallet,
      toWallet,
      transactionHash,
      blockNumber,
    } = req.body;

    if (!transactionType || !ethAmount || !fromWallet || !toWallet || !transactionHash) {
      return res.status(400).json({
        error: 'Required fields: transactionType, ethAmount, fromWallet, toWallet, transactionHash',
      });
    }

    const payment = await benefactorService.recordSmartContractPayment({
      transactionType,
      ethAmount: parseFloat(ethAmount),
      tokenId: tokenId ? parseInt(tokenId) : undefined,
      nftName,
      auctionId,
      tradeId,
      fromWallet,
      toWallet,
      transactionHash,
      blockNumber: blockNumber ? parseInt(blockNumber) : undefined,
    });

    res.json(payment);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Transaction already recorded' });
    }
    console.error('Failed to record crypto payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// GET /api/benefactor/admin/crypto/export - Export crypto payments CSV
router.get('/admin/crypto/export', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const csv = await benefactorService.exportSmartContractPaymentsCSV(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="crypto-payments.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Failed to export crypto payments:', error);
    res.status(500).json({ error: 'Failed to export' });
  }
});

// ============================================
// ADMIN ROUTES - Total Donated Dashboard (System 3)
// ============================================

// GET /api/benefactor/admin/dashboard - Full dashboard data
router.get('/admin/dashboard', async (req: Request, res: Response) => {
  try {
    const [totalDonated, monthlyBreakdown, cryptoStatus, currentPayment, reminder] = await Promise.all([
      benefactorService.getTotalDonated(),
      benefactorService.getMonthlyDonationBreakdown(),
      benefactorService.getSmartContractStatus(),
      benefactorService.getCurrentMonthPayment(),
      benefactorService.checkAndCreateReminder(),
    ]);

    res.json({
      totalDonated,
      monthlyBreakdown,
      cryptoStatus,
      currentPayment,
      reminder,
    });
  } catch (error) {
    console.error('Failed to get dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/benefactor/admin/timeline - Combined donation timeline
router.get('/admin/timeline', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type } = req.query;

    const timeline = await benefactorService.getDonationTimeline({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      type: type as 'manual' | 'crypto' | 'all',
    });

    res.json({ timeline });
  } catch (error) {
    console.error('Failed to get timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// GET /api/benefactor/admin/monthly-breakdown - Monthly donation breakdown
router.get('/admin/monthly-breakdown', async (req: Request, res: Response) => {
  try {
    const breakdown = await benefactorService.getMonthlyDonationBreakdown();
    res.json({ breakdown });
  } catch (error) {
    console.error('Failed to get monthly breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch breakdown' });
  }
});

// GET /api/benefactor/admin/export/combined - Export combined report CSV
router.get('/admin/export/combined', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const csv = await benefactorService.exportCombinedReportCSV(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="benefactor-combined-report.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Failed to export combined report:', error);
    res.status(500).json({ error: 'Failed to export' });
  }
});

// ============================================
// ADMIN ROUTES - Reminders
// ============================================

// GET /api/benefactor/admin/reminders - Get unacknowledged reminders
router.get('/admin/reminders', async (req: Request, res: Response) => {
  try {
    const reminders = await benefactorService.getUnacknowledgedReminders();
    res.json({ reminders });
  } catch (error) {
    console.error('Failed to get reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

export default router;
