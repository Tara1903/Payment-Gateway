import { redirect } from 'next/navigation';

// Root redirects to a placeholder — actual entry is via /checkout/[orderId]
export default function HomePage() {
  redirect('/admin/dashboard');
}
