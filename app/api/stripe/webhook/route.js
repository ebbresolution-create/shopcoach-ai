import Stripe from 'stripe';
import { createClient } from '@/app/lib/supabase';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function determineTier(priceAmount) {
  if (priceAmount === 2700) return 'starter';
  if (priceAmount === 6700) return 'pro';
  if (priceAmount === 19700) return 'agency';
  return 'free';
}

async function handleCheckoutSessionCompleted(session) {
  const userId = session.metadata?.userId;
  const stripeCustomerId = session.customer;
  const subscriptionId = session.subscription;

  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  try {
    const supabase = createClient();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceAmount = subscription.items.data[0]?.price.unit_amount;
    const tier = determineTier(priceAmount);

    const { error } = await supabase
      .from('profiles')
      .update({
        tier,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq('user_id', userId);

    if (error) console.error('Error updating profile:', error);
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  try {
    const supabase = createClient();
    const priceAmount = subscription.items.data[0]?.price.unit_amount;
    const tier = determineTier(priceAmount);

    const { error } = await supabase
      .from('profiles')
      .update({ tier })
      .eq('user_id', userId);

    if (error) console.error('Error updating subscription:', error);
  } catch (error) {
    console.error('Error handling subscription.updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ tier: 'free' })
      .eq('user_id', userId);

    if (error) console.error('Error updating profile on delete:', error);
  } catch (error) {
    console.error('Error handling subscription.deleted:', error);
  }
}

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log('Unhandled event type: ' + event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
