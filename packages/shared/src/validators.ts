import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const ManualVerificationSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  utrEntered: z.string().regex(/^\d{12}$/, 'UTR must be exactly 12 digits').optional(),
  screenshotUrl: z.string().url().optional(),
  notes: z.string().max(500).optional(),
});

export const AndroidWebhookSchema = z.array(z.object({
  id: z.string(),
  amount: z.number(),
  sender: z.string(),
  referenceId: z.string().nullable().optional(),
  timestamp: z.number(),
  syncStatus: z.string(),
  rawMessage: z.string(),
}));

export const HeartbeatSchema = z.object({
  deviceId: z.string().min(1),
  batteryLevel: z.number().min(0).max(100),
  appVersion: z.string(),
  queueDepth: z.number().min(0).default(0),
  timestamp: z.string(),
});

export const CreateOrderSchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  currency: z.string().length(3).default('INR'),
  description: z.string().max(255).optional(),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  metadata: z.record(z.unknown()).optional(),
});
