import cron from 'node-cron';
import { benefactorService } from '../services/benefactor.service';
import { emailService } from '../services/email.service';
import { logger } from '../utils/logger';

/**
 * Benefactor Payment Reminder Job
 *
 * Runs daily at 9:00 AM to check for payment reminders:
 * - 1st of month: "Payment due today"
 * - 6th of month (if unpaid): "Payment overdue by 5 days"
 * - 11th of month (if unpaid): "Payment overdue by 10 days"
 * - After 11th: Email every 3 days until paid
 */
export function startBenefactorReminderJob() {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running benefactor payment reminder check...');

    try {
      const settings = await benefactorService.getBenefactorSettings();

      if (!settings.enableReminders || !settings.adminEmail) {
        logger.info('Benefactor reminders disabled or no admin email configured');
        return;
      }

      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Get current month's payment
      const payment = await benefactorService.getOrCreateMonthlyPayment(currentMonth, currentYear);

      if (payment.status === 'PAID') {
        logger.info('Current month payment already marked as paid');
        return;
      }

      // Determine if we should send a reminder
      let shouldSendReminder = false;
      let reminderType = '';
      let daysOverdue = 0;

      if (currentDay === 1) {
        // Payment due today
        shouldSendReminder = true;
        reminderType = 'DUE_TODAY';
      } else if (currentDay === 6) {
        // 5 days overdue
        shouldSendReminder = true;
        reminderType = 'OVERDUE_5';
        daysOverdue = 5;
      } else if (currentDay === 11) {
        // 10 days overdue
        shouldSendReminder = true;
        reminderType = 'OVERDUE_10';
        daysOverdue = 10;
      } else if (currentDay > 11 && (currentDay - 11) % 3 === 0) {
        // Every 3 days after day 11
        shouldSendReminder = true;
        reminderType = 'DAILY';
        daysOverdue = currentDay - 1;
      }

      if (shouldSendReminder) {
        // Send email reminder
        await emailService.sendBenefactorPaymentReminder({
          to: settings.adminEmail,
          month: currentMonth,
          year: currentYear,
          totalOwedCents: payment.totalOwedCents,
          primarySalesCents: payment.primarySalesCents,
          auctionSalesCents: payment.auctionSalesCents,
          daysOverdue,
          reminderType,
        });

        logger.info(`Sent benefactor payment reminder: ${reminderType} for ${currentMonth}/${currentYear}`);
      }
    } catch (error) {
      logger.error('Failed to run benefactor reminder job:', error);
    }
  });

  logger.info('Benefactor reminder job scheduled (daily at 9:00 AM)');
}
