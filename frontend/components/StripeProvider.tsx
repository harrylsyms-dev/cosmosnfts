import { ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

interface StripeProviderProps {
  children: ReactNode;
}

// Only load Stripe if key is available
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export default function StripeProvider({ children }: StripeProviderProps) {
  // If no Stripe key, just render children without Elements wrapper
  if (!stripePromise) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
