import { useQuery } from '@tanstack/react-query';
import { useBackend } from '../hooks/useBackend';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireSubscription?: boolean;
  fallback?: React.ReactNode;
}

export default function RoleGuard({ 
  children, 
  allowedRoles = ['user', 'admin'], 
  requireSubscription = false,
  fallback 
}: RoleGuardProps) {
  const backend = useBackend();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => backend.users.getUserProfile()
  });

  const { data: access } = useQuery({
    queryKey: ['user-access'],
    queryFn: () => backend.users.checkAccess(),
    enabled: !!profile
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return fallback || (
      <Card className="m-4">
        <CardContent className="p-6 text-center">
          <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-600">
            Please sign in to access this feature.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check role access
  if (!allowedRoles.includes(profile.role)) {
    return fallback || (
      <Card className="m-4">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-600">
            You don't have permission to access this feature.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Required role: {allowedRoles.join(' or ')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check subscription access
  if (requireSubscription && access && !access.hasAccess) {
    return fallback || (
      <Card className="m-4">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Subscription Required
          </h3>
          <p className="text-gray-600 mb-2">
            {access.reason || 'This feature requires an active subscription.'}
          </p>
          {profile.subscriptionStatus === 'trial' && profile.trialDaysLeft && profile.trialDaysLeft > 0 ? (
            <p className="text-sm text-blue-600">
              You have {profile.trialDaysLeft} days left in your trial.
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Upgrade to continue using this feature.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}