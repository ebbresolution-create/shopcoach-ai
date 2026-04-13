'use client';

import { useState } from 'react';

const PRICE_IDS = {
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter',
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro',
  agency: process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID || 'price_agency',
};

const pricingTiers = [
  {
    name: 'Starter', price: 27, description: 'Perfect for getting started',
    priceId: PRICE_IDS.starter, highlighted: false, badge: null,
    features: ['50 sessions/month', 'Core modes (1-4)', 'Email support', 'Community access'],
  },
  {
    name: 'Pro', price: 67, description: 'Most popular for growth',
    priceId: PRICE_IDS.pro, highlighted: true, badge: 'MOST POPULAR',
    features: ['Unlimited sessions', 'All 6 modes', 'Priority email & chat support', 'Weekly group calls', 'Advanced analytics', 'Custom workflows'],
  },
  {
    name: 'Agency', price: 197, description: 'For teams and agencies',
    priceId: PRICE_IDS.agency, highlighted: false, badge: null,
    features: ['10 team seats', 'All modes unlimited', 'White-label options', 'API access', 'Dedicated account manager', '24/7 priority support'],
  },
];

export default function PricingModal({ isOpen, onClose, userId, userEmail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGetStarted = async (priceId) => {
    if (!userId || !userEmail) { setError('Please sign in to continue'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId, userEmail }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to create checkout session'); return; }
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Checkout error:', err);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="sticky top-4 right-4 float-right text-gray-400 hover:text-white transition-colors z-10 bg-[#0d1117] rounded-full p-1 text-xl">&times;</button>
        <div className="p-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Simple, Transparent Pricing</h2>
            <p className="text-gray-400">Choose the plan that fits your needs. Always flexible to scale.</p>
          </div>

          <div className="mb-10 bg-gradient-to-r from-pink-900 via-pink-800 to-pink-900 border border-pink-600 rounded-lg p-4 text-center">
            <p className="text-white font-semibold">Founding Member Offer: Lock in <span className="text-pink-200">$27/mo forever</span></p>
            <p className="text-pink-200 text-sm mt-1">Limited time only. Offer expires when beta ends.</p>
          </div>

          {error && <div className="mb-6 bg-red-900 bg-opacity-30 border border-red-700 rounded px-4 py-3 text-sm text-red-300">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {pricingTiers.map((tier) => (
              <div key={tier.name}
                className={`rounded-lg border transition-all transform hover:scale-105 ${tier.highlighted ? 'border-cyan-400 bg-gradient-to-br from-[#0d1117] to-[#161b22] ring-2 ring-cyan-400 ring-opacity-50' : 'border-[#1e2a3a] bg-[#0d1117]'} p-6 relative`}>
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">{tier.badge}</span>
                  </div>
                )}
                <div className="mb-6 pt-2">
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${tier.price}</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-cyan-400">&#10003;</span>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleGetStarted(tier.priceId)} disabled={loading}
                  className={`w-full font-semibold py-2 rounded transition-all ${tier.highlighted ? 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white' : 'bg-[#161b22] hover:bg-[#1c2128] text-cyan-400 border border-cyan-400'}`}>
                  {loading ? 'Processing...' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center border-t border-[#1e2a3a] pt-8">
            <p className="text-gray-400 text-sm">Questions? <a href="mailto:support@shopcoach.ai" className="text-cyan-400 hover:text-cyan-300">Contact our team</a>. All plans include a 7-day free trial.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
