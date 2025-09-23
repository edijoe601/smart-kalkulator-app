import { useQuery } from '@tanstack/react-query';
import { useBackend } from '../hooks/useBackend';
import { Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function TrialBanner() {
  const backend = useBackend();
  
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => backend.users.getUserProfile(),
    refetchInterval: 60000 // Check every minute
  });

  if (!profile) return null;

  // Don't show banner if user has active subscription
  if (profile.subscriptionStatus === 'active') return null;

  // Don't show if trial period is over
  if (profile.subscriptionStatus === 'trial' && (profile.trialDaysLeft || 0) <= 0) {
    return (
      <Card className="bg-red-50 border-red-200 mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Trial Period Expired</p>
                <p className="text-sm text-red-600">
                  Subscribe now to continue using all features
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscribe Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show trial countdown
  if (profile.subscriptionStatus === 'trial' && profile.trialDaysLeft !== undefined) {
    const isUrgent = profile.trialDaysLeft <= 3;
    
    return (
      <Card className={`${isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'} mb-4`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className={`w-5 h-5 ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`} />
              <div>
                <p className={`font-medium ${isUrgent ? 'text-orange-800' : 'text-blue-800'}`}>
                  {profile.trialDaysLeft} days left in trial
                </p>
                <p className={`text-sm ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`}>
                  {isUrgent 
                    ? 'Subscribe now to avoid service interruption'
                    : 'Enjoying the app? Consider upgrading to premium'
                  }
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              className={`${isUrgent 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}