import { pgTable, text, uuid, timestamp, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders, paymentMethodEnum, paymentStatusEnum } from './orders.js';

export const payments = pgTable('payments', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    amount: numeric('amount').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    status: paymentStatusEnum('status').notNull().default('pending'),
    transactionId: text('transaction_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
    order: one(orders, {
        fields: [payments.orderId],
        references: [orders.id],
    }),
}));

export const paymentsSchema = {
    payments,
    paymentsRelations,
};
