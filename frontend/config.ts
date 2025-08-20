// The Clerk publishable key, to initialize Clerk.
// TODO: Set this to your Clerk publishable key, which can be found in the Clerk dashboard.
export const clerkPublishableKey = "pk_test_your_clerk_publishable_key_here";

// API base URL
export const apiBaseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-api.com' 
  : 'http://localhost:4000';

// Frontend URL for catalog links
export const frontendUrl = process.env.NODE_ENV === 'production'
  ? 'https://your-production-frontend.com'
  : 'http://localhost:3000';
