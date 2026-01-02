import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CoinGecko API for ETH price (free, no auth required)
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

// ============================================
// ETH PRICE FUNCTIONS
// ============================================

interface EthPrice {
  priceUsd: number;
  timestamp: Date;
  source: string;
}

let cachedEthPrice: EthPrice | null = null;
let lastPriceFetch = 0;
const PRICE_CACHE_MS = 30000; // 30 seconds

export async function getCurrentEthPrice(): Promise<number> {
  const now = Date.now();

  // Return cached price if fresh
  if (cachedEthPrice && (now - lastPriceFetch) < PRICE_CACHE_MS) {
    return cachedEthPrice.priceUsd;
  }

  try {
    const response = await fetch(COINGECKO_API);
    if (!response.ok) {
      throw new Error('CoinGecko API failed');
    }

    const data = await response.json() as { ethereum?: { usd?: number } };
    const price = data.ethereum?.usd || 0;

    // Cache the price
    cachedEthPrice = {
      priceUsd: price,
      timestamp: new Date(),
      source: 'coingecko',
    };
    lastPriceFetch = now;

    // Store in history (every 5 minutes max)
    const lastHistory = await prisma.ethPriceHistory.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
    if (!lastHistory || lastHistory.timestamp < fiveMinutesAgo) {
      await prisma.ethPriceHistory.create({
        data: {
          priceUsd: price,
          source: 'coingecko',
        },
      });
    }

    return price;
  } catch (error) {
    console.error('Failed to fetch ETH price:', error);

    // Return last known price from cache or database
    if (cachedEthPrice) {
      return cachedEthPrice.priceUsd;
    }

    const lastPrice = await prisma.ethPriceHistory.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    return lastPrice?.priceUsd || 2500; // Fallback default
  }
}

export async function getHistoricalEthPrice(date: Date): Promise<number> {
  // Find closest price record to the given date
  const record = await prisma.ethPriceHistory.findFirst({
    where: {
      timestamp: {
        lte: date,
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  return record?.priceUsd || 2500; // Fallback
}

// ============================================
// BENEFACTOR SETTINGS
// ============================================

export async function getBenefactorSettings() {
  let settings = await prisma.benefactorSettings.findUnique({
    where: { id: 'main' },
  });

  if (!settings) {
    settings = await prisma.benefactorSettings.create({
      data: { id: 'main' },
    });
  }

  return settings;
}

export async function updateBenefactorSettings(data: {
  benefactorName?: string;
  benefactorWallet?: string;
  creatorWallet?: string;
  benefactorSharePercent?: number;
  creatorSharePercent?: number;
  adminEmail?: string;
  enableReminders?: boolean;
}) {
  return prisma.benefactorSettings.upsert({
    where: { id: 'main' },
    update: data,
    create: { id: 'main', ...data },
  });
}

// ============================================
// PAYMENT METHODS
// ============================================

export async function getPaymentMethods() {
  return prisma.benefactorPaymentMethod.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createPaymentMethod(name: string, description?: string) {
  return prisma.benefactorPaymentMethod.create({
    data: { name, description },
  });
}

export async function deletePaymentMethod(id: string) {
  return prisma.benefactorPaymentMethod.delete({
    where: { id },
  });
}

export async function setDefaultPaymentMethod(id: string) {
  // Remove default from all
  await prisma.benefactorPaymentMethod.updateMany({
    data: { isDefault: false },
  });

  // Set new default
  return prisma.benefactorPaymentMethod.update({
    where: { id },
    data: { isDefault: true },
  });
}

// ============================================
// MANUAL PAYMENT TRACKER (System 1)
// ============================================

export async function calculateMonthlyOwed(month: number, year: number) {
  const settings = await getBenefactorSettings();
  const benefactorPercent = settings.benefactorSharePercent / 100;

  // Calculate date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Get primary sales revenue (Stripe purchases)
  const primarySales = await prisma.purchase.aggregate({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: 'MINTED',
    },
    _sum: {
      totalAmountCents: true,
    },
  });

  // Get USD auction sales (Stripe-paid auctions)
  // Note: Crypto auctions are auto-paid via smart contract
  const auctionSales = await prisma.auctionHistory.aggregate({
    where: {
      auctionDate: {
        gte: startDate,
        lte: endDate,
      },
      // Only USD payments (no blockchain hash means Stripe payment)
      blockchainHash: null,
    },
    _sum: {
      finalPriceCents: true,
    },
  });

  const primaryRevenue = primarySales._sum.totalAmountCents || 0;
  const auctionRevenue = auctionSales._sum.finalPriceCents || 0;
  const totalRevenue = primaryRevenue + auctionRevenue;

  const primaryOwed = Math.round(primaryRevenue * benefactorPercent);
  const auctionOwed = Math.round(auctionRevenue * benefactorPercent);
  const totalOwed = primaryOwed + auctionOwed;

  return {
    month,
    year,
    primaryRevenueCents: primaryRevenue,
    auctionRevenueCents: auctionRevenue,
    totalRevenueCents: totalRevenue,
    primaryOwedCents: primaryOwed,
    auctionOwedCents: auctionOwed,
    totalOwedCents: totalOwed,
    benefactorPercent: settings.benefactorSharePercent,
    creatorPercent: settings.creatorSharePercent,
  };
}

export async function getOrCreateMonthlyPayment(month: number, year: number) {
  // Check if payment record exists
  let payment = await prisma.benefactorPayment.findUnique({
    where: { month_year: { month, year } },
  });

  if (!payment) {
    // Calculate amounts and create record
    const calculated = await calculateMonthlyOwed(month, year);

    payment = await prisma.benefactorPayment.create({
      data: {
        month,
        year,
        primarySalesCents: calculated.primaryOwedCents,
        auctionSalesCents: calculated.auctionOwedCents,
        totalOwedCents: calculated.totalOwedCents,
        primaryRevenueCents: calculated.primaryRevenueCents,
        auctionRevenueCents: calculated.auctionRevenueCents,
        dueDate: new Date(year, month - 1, 1), // 1st of the month
        status: 'UNPAID',
      },
    });
  }

  return payment;
}

export async function getCurrentMonthPayment() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return getOrCreateMonthlyPayment(month, year);
}

export async function getUnpaidPayments() {
  return prisma.benefactorPayment.findMany({
    where: {
      status: { in: ['UNPAID', 'LATE'] },
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
}

export async function markPaymentAsPaid(
  paymentId: string,
  data: {
    paymentMethodId?: string;
    paymentMethodName: string;
    referenceNumber?: string;
    notes?: string;
  }
) {
  const payment = await prisma.benefactorPayment.update({
    where: { id: paymentId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      paymentMethodId: data.paymentMethodId,
      paymentMethodName: data.paymentMethodName,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
    },
  });

  // Mark any reminders as acknowledged
  const paymentRecord = await prisma.benefactorPayment.findUnique({
    where: { id: paymentId },
  });

  if (paymentRecord) {
    await prisma.benefactorReminder.updateMany({
      where: {
        month: paymentRecord.month,
        year: paymentRecord.year,
        acknowledged: false,
      },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
    });
  }

  return payment;
}

export async function getPaymentHistory(filters?: {
  year?: number;
  status?: string;
}) {
  const where: any = {};

  if (filters?.year) {
    where.year = filters.year;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  return prisma.benefactorPayment.findMany({
    where,
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
}

export async function refreshPaymentAmounts(paymentId: string) {
  const payment = await prisma.benefactorPayment.findUnique({
    where: { id: paymentId },
  });

  if (!payment || payment.status === 'PAID') {
    return payment;
  }

  const calculated = await calculateMonthlyOwed(payment.month, payment.year);

  return prisma.benefactorPayment.update({
    where: { id: paymentId },
    data: {
      primarySalesCents: calculated.primaryOwedCents,
      auctionSalesCents: calculated.auctionOwedCents,
      totalOwedCents: calculated.totalOwedCents,
      primaryRevenueCents: calculated.primaryRevenueCents,
      auctionRevenueCents: calculated.auctionRevenueCents,
    },
  });
}

// ============================================
// SMART CONTRACT PAYMENTS (System 2)
// ============================================

export async function recordSmartContractPayment(data: {
  transactionType: 'AUCTION_SALE' | 'CREATOR_ROYALTY';
  ethAmount: number;
  tokenId?: number;
  nftName?: string;
  auctionId?: string;
  tradeId?: string;
  fromWallet: string;
  toWallet: string;
  transactionHash: string;
  blockNumber?: number;
}) {
  const ethPrice = await getCurrentEthPrice();
  const usdValue = data.ethAmount * ethPrice;

  return prisma.smartContractPayment.create({
    data: {
      transactionType: data.transactionType,
      ethAmount: data.ethAmount,
      usdValueAtTime: usdValue,
      ethPriceAtTime: ethPrice,
      tokenId: data.tokenId,
      nftName: data.nftName,
      auctionId: data.auctionId,
      tradeId: data.tradeId,
      fromWallet: data.fromWallet,
      toWallet: data.toWallet,
      transactionHash: data.transactionHash,
      blockNumber: data.blockNumber,
      status: 'CONFIRMED',
    },
  });
}

export async function getSmartContractPayments(filters?: {
  startDate?: Date;
  endDate?: Date;
  transactionType?: string;
}) {
  const where: any = {};

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  if (filters?.transactionType) {
    where.transactionType = filters.transactionType;
  }

  return prisma.smartContractPayment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSmartContractPaymentsByMonth() {
  const payments = await prisma.smartContractPayment.findMany({
    where: { status: 'CONFIRMED' },
    orderBy: { createdAt: 'desc' },
  });

  // Group by month
  const grouped: Record<string, {
    month: number;
    year: number;
    auctionEth: number;
    royaltyEth: number;
    totalEth: number;
    usdValueAtTime: number;
    transactionCount: number;
    transactions: typeof payments;
  }> = {};

  for (const payment of payments) {
    const date = new Date(payment.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!grouped[key]) {
      grouped[key] = {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        auctionEth: 0,
        royaltyEth: 0,
        totalEth: 0,
        usdValueAtTime: 0,
        transactionCount: 0,
        transactions: [],
      };
    }

    grouped[key].totalEth += payment.ethAmount;
    grouped[key].usdValueAtTime += payment.usdValueAtTime;
    grouped[key].transactionCount += 1;
    grouped[key].transactions.push(payment);

    if (payment.transactionType === 'AUCTION_SALE') {
      grouped[key].auctionEth += payment.ethAmount;
    } else if (payment.transactionType === 'CREATOR_ROYALTY') {
      grouped[key].royaltyEth += payment.ethAmount;
    }
  }

  // Convert to array and calculate current USD value
  const ethPrice = await getCurrentEthPrice();

  return Object.values(grouped).map((group) => ({
    ...group,
    currentUsdValue: group.totalEth * ethPrice,
    ethPrice,
  }));
}

export async function getSmartContractStatus() {
  const settings = await getBenefactorSettings();

  const lastPayment = await prisma.smartContractPayment.findFirst({
    where: { status: 'CONFIRMED' },
    orderBy: { createdAt: 'desc' },
  });

  const allTimeTotal = await prisma.smartContractPayment.aggregate({
    where: { status: 'CONFIRMED' },
    _sum: {
      ethAmount: true,
      usdValueAtTime: true,
    },
    _count: true,
  });

  const ethPrice = await getCurrentEthPrice();

  return {
    benefactorWallet: settings.benefactorWallet,
    creatorWallet: settings.creatorWallet,
    splitPercent: {
      benefactor: settings.benefactorSharePercent,
      creator: settings.creatorSharePercent,
    },
    lastTransaction: lastPayment,
    allTime: {
      totalEth: allTimeTotal._sum.ethAmount || 0,
      totalUsdAtTime: allTimeTotal._sum.usdValueAtTime || 0,
      currentUsdValue: (allTimeTotal._sum.ethAmount || 0) * ethPrice,
      transactionCount: allTimeTotal._count,
    },
    currentEthPrice: ethPrice,
  };
}

// ============================================
// TOTAL DONATED DASHBOARD (System 3)
// ============================================

export async function getTotalDonated() {
  const settings = await getBenefactorSettings();
  const ethPrice = await getCurrentEthPrice();

  // Get all manual payments (PAID only)
  const manualPayments = await prisma.benefactorPayment.aggregate({
    where: { status: 'PAID' },
    _sum: {
      totalOwedCents: true,
    },
  });

  // Get all smart contract payments
  const cryptoPayments = await prisma.smartContractPayment.aggregate({
    where: { status: 'CONFIRMED' },
    _sum: {
      ethAmount: true,
      usdValueAtTime: true,
    },
  });

  const manualTotalCents = manualPayments._sum.totalOwedCents || 0;
  const manualTotalUsd = manualTotalCents / 100;

  const cryptoTotalEth = cryptoPayments._sum.ethAmount || 0;
  const cryptoTotalUsdAtTime = cryptoPayments._sum.usdValueAtTime || 0;
  const cryptoCurrentUsd = cryptoTotalEth * ethPrice;

  const grandTotalUsd = manualTotalUsd + cryptoCurrentUsd;

  return {
    benefactorName: settings.benefactorName,
    manual: {
      totalCents: manualTotalCents,
      totalUsd: manualTotalUsd,
      formatted: formatCurrency(manualTotalUsd),
    },
    crypto: {
      totalEth: cryptoTotalEth,
      usdAtTimeOfPayment: cryptoTotalUsdAtTime,
      currentUsd: cryptoCurrentUsd,
      formattedEth: `${cryptoTotalEth.toFixed(4)} ETH`,
      formattedUsd: formatCurrency(cryptoCurrentUsd),
    },
    grandTotal: {
      usd: grandTotalUsd,
      formatted: formatCurrency(grandTotalUsd),
    },
    ethPrice: {
      current: ethPrice,
      formatted: formatCurrency(ethPrice),
    },
    lastUpdated: new Date().toISOString(),
  };
}

export async function getDonationTimeline(filters?: {
  startDate?: Date;
  endDate?: Date;
  type?: 'manual' | 'crypto' | 'all';
}) {
  const timeline: Array<{
    date: Date;
    type: 'manual' | 'crypto';
    amountUsd: number;
    amountEth?: number;
    description: string;
  }> = [];

  // Get manual payments
  if (!filters?.type || filters.type === 'all' || filters.type === 'manual') {
    const manualPayments = await prisma.benefactorPayment.findMany({
      where: {
        status: 'PAID',
        paidAt: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    for (const payment of manualPayments) {
      timeline.push({
        date: payment.paidAt!,
        type: 'manual',
        amountUsd: payment.totalOwedCents / 100,
        description: `${getMonthName(payment.month)} ${payment.year} payment via ${payment.paymentMethodName}`,
      });
    }
  }

  // Get crypto payments
  if (!filters?.type || filters.type === 'all' || filters.type === 'crypto') {
    const cryptoPayments = await prisma.smartContractPayment.findMany({
      where: {
        status: 'CONFIRMED',
        createdAt: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const payment of cryptoPayments) {
      timeline.push({
        date: payment.createdAt,
        type: 'crypto',
        amountUsd: payment.usdValueAtTime,
        amountEth: payment.ethAmount,
        description: `${payment.transactionType === 'AUCTION_SALE' ? 'Auction sale' : 'Creator royalty'}${payment.nftName ? ` - ${payment.nftName}` : ''}`,
      });
    }
  }

  // Sort by date descending
  timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

  return timeline;
}

export async function getMonthlyDonationBreakdown() {
  const ethPrice = await getCurrentEthPrice();

  // Get all manual payments
  const manualPayments = await prisma.benefactorPayment.findMany({
    where: { status: 'PAID' },
  });

  // Get all crypto payments grouped by month
  const cryptoByMonth = await getSmartContractPaymentsByMonth();

  // Combine into monthly breakdown
  const months: Record<string, {
    month: number;
    year: number;
    manualUsd: number;
    cryptoEth: number;
    cryptoUsd: number;
    totalUsd: number;
  }> = {};

  // Add manual payments
  for (const payment of manualPayments) {
    const key = `${payment.year}-${payment.month}`;
    if (!months[key]) {
      months[key] = {
        month: payment.month,
        year: payment.year,
        manualUsd: 0,
        cryptoEth: 0,
        cryptoUsd: 0,
        totalUsd: 0,
      };
    }
    months[key].manualUsd += payment.totalOwedCents / 100;
  }

  // Add crypto payments
  for (const crypto of cryptoByMonth) {
    const key = `${crypto.year}-${crypto.month}`;
    if (!months[key]) {
      months[key] = {
        month: crypto.month,
        year: crypto.year,
        manualUsd: 0,
        cryptoEth: 0,
        cryptoUsd: 0,
        totalUsd: 0,
      };
    }
    months[key].cryptoEth += crypto.totalEth;
    months[key].cryptoUsd += crypto.totalEth * ethPrice;
  }

  // Calculate totals
  for (const key of Object.keys(months)) {
    months[key].totalUsd = months[key].manualUsd + months[key].cryptoUsd;
  }

  // Sort by date descending
  return Object.values(months).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

// ============================================
// REMINDER SYSTEM
// ============================================

export async function checkAndCreateReminder(): Promise<{
  showPopup: boolean;
  payment: any;
  reminderType: string | null;
  daysOverdue: number;
}> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();

  // Get current month's payment
  const payment = await getOrCreateMonthlyPayment(currentMonth, currentYear);

  if (payment.status === 'PAID') {
    return { showPopup: false, payment, reminderType: null, daysOverdue: 0 };
  }

  // Update status to LATE if overdue
  if (currentDay > 1 && payment.status === 'UNPAID') {
    await prisma.benefactorPayment.update({
      where: { id: payment.id },
      data: { status: 'LATE' },
    });
    payment.status = 'LATE';
  }

  const daysOverdue = currentDay - 1;
  let reminderType: string | null = null;

  // Determine reminder type
  if (currentDay === 1) {
    reminderType = 'DUE_TODAY';
  } else if (currentDay === 6) {
    reminderType = 'OVERDUE_5';
  } else if (currentDay === 11) {
    reminderType = 'OVERDUE_10';
  } else if (currentDay > 11 && (currentDay - 11) % 3 === 0) {
    reminderType = 'DAILY';
  }

  // Check if we've already sent this reminder today
  if (reminderType) {
    const existingReminder = await prisma.benefactorReminder.findFirst({
      where: {
        month: currentMonth,
        year: currentYear,
        reminderType,
        sentAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      },
    });

    if (!existingReminder) {
      // Create reminder record
      await prisma.benefactorReminder.create({
        data: {
          month: currentMonth,
          year: currentYear,
          reminderType,
          daysSent: daysOverdue,
        },
      });
    }
  }

  return {
    showPopup: payment.status !== 'PAID',
    payment,
    reminderType,
    daysOverdue,
  };
}

export async function snoozeReminder(paymentId: string) {
  const payment = await prisma.benefactorPayment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) return null;

  // Mark today's reminders as acknowledged
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.benefactorReminder.updateMany({
    where: {
      month: payment.month,
      year: payment.year,
      sentAt: { gte: today },
      acknowledged: false,
    },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
    },
  });

  return { snoozed: true, nextReminder: getNextReminderDate(payment.month, payment.year) };
}

function getNextReminderDate(month: number, year: number): Date {
  const now = new Date();
  const currentDay = now.getDate();

  // Calculate next reminder date
  if (currentDay < 6) return new Date(year, month - 1, 6);
  if (currentDay < 11) return new Date(year, month - 1, 11);

  // Every 3 days after the 11th
  const nextDay = 11 + Math.ceil((currentDay - 11 + 1) / 3) * 3;
  return new Date(year, month - 1, nextDay);
}

export async function getUnacknowledgedReminders() {
  const now = new Date();
  return prisma.benefactorReminder.findMany({
    where: {
      acknowledged: false,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
    orderBy: { sentAt: 'desc' },
  });
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

export async function exportPaymentHistoryCSV(year?: number) {
  const payments = await getPaymentHistory({ year });

  const headers = [
    'Month',
    'Year',
    'Primary Sales Revenue',
    'Auction Sales Revenue',
    'Total Revenue',
    'Primary Owed (30%)',
    'Auction Owed (30%)',
    'Total Owed',
    'Status',
    'Payment Method',
    'Reference Number',
    'Date Paid',
    'Notes',
  ];

  const rows = payments.map((p) => [
    getMonthName(p.month),
    p.year.toString(),
    formatCurrency(p.primaryRevenueCents / 100),
    formatCurrency(p.auctionRevenueCents / 100),
    formatCurrency((p.primaryRevenueCents + p.auctionRevenueCents) / 100),
    formatCurrency(p.primarySalesCents / 100),
    formatCurrency(p.auctionSalesCents / 100),
    formatCurrency(p.totalOwedCents / 100),
    p.status,
    p.paymentMethodName || '',
    p.referenceNumber || '',
    p.paidAt ? p.paidAt.toISOString().split('T')[0] : '',
    p.notes || '',
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

export async function exportSmartContractPaymentsCSV(startDate?: Date, endDate?: Date) {
  const payments = await getSmartContractPayments({ startDate, endDate });

  const headers = [
    'Date',
    'Type',
    'ETH Amount',
    'USD Value (at time)',
    'ETH Price (at time)',
    'Token ID',
    'NFT Name',
    'Transaction Hash',
    'From Wallet',
    'To Wallet',
    'Status',
  ];

  const rows = payments.map((p) => [
    p.createdAt.toISOString(),
    p.transactionType,
    p.ethAmount.toFixed(6),
    formatCurrency(p.usdValueAtTime),
    formatCurrency(p.ethPriceAtTime),
    p.tokenId?.toString() || '',
    p.nftName || '',
    p.transactionHash,
    p.fromWallet,
    p.toWallet,
    p.status,
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

export async function exportCombinedReportCSV(startDate?: Date, endDate?: Date) {
  const timeline = await getDonationTimeline({ startDate, endDate });

  const headers = [
    'Date',
    'Type',
    'Amount (USD)',
    'Amount (ETH)',
    'Description',
  ];

  const rows = timeline.map((t) => [
    t.date.toISOString().split('T')[0],
    t.type,
    formatCurrency(t.amountUsd),
    t.amountEth?.toFixed(6) || '',
    t.description,
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month - 1] || '';
}

export const benefactorService = {
  // ETH Price
  getCurrentEthPrice,
  getHistoricalEthPrice,

  // Settings
  getBenefactorSettings,
  updateBenefactorSettings,

  // Payment Methods
  getPaymentMethods,
  createPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,

  // Manual Payments (System 1)
  calculateMonthlyOwed,
  getOrCreateMonthlyPayment,
  getCurrentMonthPayment,
  getUnpaidPayments,
  markPaymentAsPaid,
  getPaymentHistory,
  refreshPaymentAmounts,

  // Smart Contract Payments (System 2)
  recordSmartContractPayment,
  getSmartContractPayments,
  getSmartContractPaymentsByMonth,
  getSmartContractStatus,

  // Total Donated (System 3)
  getTotalDonated,
  getDonationTimeline,
  getMonthlyDonationBreakdown,

  // Reminders
  checkAndCreateReminder,
  snoozeReminder,
  getUnacknowledgedReminders,

  // Exports
  exportPaymentHistoryCSV,
  exportSmartContractPaymentsCSV,
  exportCombinedReportCSV,
};
