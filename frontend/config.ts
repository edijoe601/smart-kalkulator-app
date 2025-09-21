// The Clerk publishable key, to initialize Clerk.
export const clerkPublishableKey = "pk_test_ZWFnZXItYXNwLTExLmNsZXJrLmFjY291bnRzLmRldiQ";

// API base URL
export const apiBaseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-api.com' 
  : 'http://localhost:4000';

// Frontend URL for catalog links
export const frontendUrl = process.env.NODE_ENV === 'production'
  ? 'https://your-production-frontend.com'
  : 'http://localhost:3000';
