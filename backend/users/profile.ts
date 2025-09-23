import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { usersDB } from "./db";

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  subscriptionStatus: string;
  trialDaysLeft?: number;
  trialEndDate?: Date;
  subscriptionEndDate?: Date;
  onboardingCompleted: boolean;
  imageUrl: string;
}

export const getUserProfile = api<void, UserProfile>(
  { auth: true, expose: true, method: "GET", path: "/users/profile" },
  async () => {
    const auth = getAuthData()!;
    
    // Try to get user from database
    let user = await usersDB.queryRow<{
      id: string;
      email: string;
      role: string;
      subscription_status: string;
      trial_end_date: Date | null;
      subscription_end_date: Date | null;
      onboarding_completed: boolean;
    }>`
      SELECT id, email, role, subscription_status, trial_end_date, subscription_end_date, onboarding_completed
      FROM users WHERE id = ${auth.userID}
    `;
    
    // If user doesn't exist, create them
    if (!user) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 day trial
      
      await usersDB.exec`
        INSERT INTO users (id, email, role, subscription_status, trial_end_date)
        VALUES (${auth.userID}, ${auth.email}, ${auth.role}, 'trial', ${trialEndDate})
      `;
      
      user = {
        id: auth.userID,
        email: auth.email || '',
        role: auth.role,
        subscription_status: 'trial',
        trial_end_date: trialEndDate,
        subscription_end_date: null,
        onboarding_completed: false
      };
    }
    
    // Calculate trial days left
    let trialDaysLeft: number | undefined;
    if (user.subscription_status === 'trial' && user.trial_end_date) {
      const now = new Date();
      const trialEnd = new Date(user.trial_end_date);
      const diffTime = trialEnd.getTime() - now.getTime();
      trialDaysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      subscriptionStatus: user.subscription_status,
      trialDaysLeft,
      trialEndDate: user.trial_end_date || undefined,
      subscriptionEndDate: user.subscription_end_date || undefined,
      onboardingCompleted: user.onboarding_completed,
      imageUrl: auth.imageUrl
    };
  }
);

export interface UpdateOnboardingRequest {
  completed: boolean;
}

export const updateOnboarding = api<UpdateOnboardingRequest, void>(
  { auth: true, expose: true, method: "POST", path: "/users/onboarding" },
  async (req) => {
    const auth = getAuthData()!;
    
    await usersDB.exec`
      UPDATE users 
      SET onboarding_completed = ${req.completed}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${auth.userID}
    `;
  }
);

export interface SubscriptionRequest {
  paymentMethod: string;
  amount: number;
}

export interface SubscriptionResponse {
  success: boolean;
  subscriptionEndDate: Date;
  paymentId: number;
}

export const createSubscription = api<SubscriptionRequest, SubscriptionResponse>(
  { auth: true, expose: true, method: "POST", path: "/users/subscription" },
  async (req) => {
    const auth = getAuthData()!;
    
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1); // 1 month subscription
    
    // Create payment record
    const payment = await usersDB.queryRow<{ id: number }>`
      INSERT INTO subscription_payments (
        user_id, amount, payment_method, payment_status,
        subscription_start_date, subscription_end_date
      )
      VALUES (
        ${auth.userID}, ${req.amount}, ${req.paymentMethod}, 'completed',
        ${subscriptionStart}, ${subscriptionEnd}
      )
      RETURNING id
    `;
    
    // Update user subscription status
    await usersDB.exec`
      UPDATE users 
      SET 
        subscription_status = 'active',
        subscription_start_date = ${subscriptionStart},
        subscription_end_date = ${subscriptionEnd},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${auth.userID}
    `;
    
    return {
      success: true,
      subscriptionEndDate: subscriptionEnd,
      paymentId: payment!.id
    };
  }
);

export const checkAccess = api<void, { hasAccess: boolean; reason?: string }>(
  { auth: true, expose: true, method: "GET", path: "/users/access" },
  async () => {
    const auth = getAuthData()!;
    
    const user = await usersDB.queryRow<{
      subscription_status: string;
      trial_end_date: Date | null;
      subscription_end_date: Date | null;
    }>`
      SELECT subscription_status, trial_end_date, subscription_end_date
      FROM users WHERE id = ${auth.userID}
    `;
    
    if (!user) {
      return { hasAccess: false, reason: "User not found" };
    }
    
    const now = new Date();
    
    // Check if trial is still valid
    if (user.subscription_status === 'trial') {
      if (user.trial_end_date && new Date(user.trial_end_date) > now) {
        return { hasAccess: true };
      } else {
        return { hasAccess: false, reason: "Trial period expired" };
      }
    }
    
    // Check if subscription is active
    if (user.subscription_status === 'active') {
      if (user.subscription_end_date && new Date(user.subscription_end_date) > now) {
        return { hasAccess: true };
      } else {
        return { hasAccess: false, reason: "Subscription expired" };
      }
    }
    
    return { hasAccess: false, reason: "No active subscription" };
  }
);