import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PaymentPage } from '@/components/checkout/PaymentPage';

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Payment | StarPay`,
    description: `Complete your payment securely`,
  };
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  return <PaymentPage orderId={orderId} token={token} />;
}
