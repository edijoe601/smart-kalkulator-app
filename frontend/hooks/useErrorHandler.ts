import { useToast } from '@/components/ui/use-toast';

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = (error: unknown, context?: string) => {
    console.error(`Error ${context ? `in ${context}` : ''}:`, error);
    
    let message = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message);
    }

    // Handle specific error types
    if (message.includes('unauthorized') || message.includes('unauthenticated')) {
      message = 'Please sign in to continue';
    } else if (message.includes('forbidden')) {
      message = 'You don\'t have permission to perform this action';
    } else if (message.includes('not found')) {
      message = 'The requested resource was not found';
    } else if (message.includes('network') || message.includes('fetch')) {
      message = 'Network error. Please check your connection and try again';
    } else if (message.includes('trial') || message.includes('subscription')) {
      message = 'This feature requires an active subscription';
    }

    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    });
  };

  return { handleError };
}