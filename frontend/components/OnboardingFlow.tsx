import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend } from '../hooks/useBackend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Store, Package, CreditCard, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
}

export default function OnboardingFlow() {
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => backend.users.getUserProfile()
  });

  const { mutate: completeOnboarding } = useMutation({
    mutationFn: () => backend.users.updateOnboarding({ completed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({
        title: "Welcome aboard!",
        description: "You're all set to start using Smart Kalkulator."
      });
    }
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Smart Kalkulator',
      description: 'Your all-in-one business management solution',
      icon: Store,
      completed: true
    },
    {
      id: 'setup-products',
      title: 'Add Your First Products',
      description: 'Start by adding ingredients, recipes, and products to your inventory',
      icon: Package,
      completed: false
    },
    {
      id: 'explore-features',
      title: 'Explore Key Features',
      description: 'Learn about POS, sales tracking, and business analytics',
      icon: Users,
      completed: false
    },
    {
      id: 'subscription',
      title: 'Consider Upgrading',
      description: 'Unlock advanced features with a premium subscription',
      icon: CreditCard,
      completed: false
    }
  ];

  // Don't show if user has completed onboarding
  if (profile?.onboardingCompleted) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Store className="w-6 h-6" />
              Getting Started
            </CardTitle>
            <Badge variant="secondary">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Current step */}
          <div className="text-center space-y-4">
            {React.createElement(steps[currentStep].icon, { 
              className: "w-16 h-16 mx-auto text-blue-600" 
            })}
            <div>
              <h3 className="text-xl font-semibold">{steps[currentStep].title}</h3>
              <p className="text-gray-600 mt-2">{steps[currentStep].description}</p>
            </div>
          </div>

          {/* Step-specific content */}
          <div className="bg-gray-50 rounded-lg p-4">
            {currentStep === 0 && (
              <div className="text-center space-y-3">
                <p>Smart Kalkulator helps you manage your business with:</p>
                <ul className="text-left space-y-2 max-w-md mx-auto">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Inventory & product management
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Point of sale system
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Sales analytics & reports
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    WhatsApp catalog integration
                  </li>
                </ul>
              </div>
            )}

            {currentStep === 1 && (
              <div className="text-center space-y-3">
                <p>Let's get your inventory set up:</p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    Add Ingredients
                  </Button>
                  <Button variant="outline" className="w-full">
                    Create Recipes
                  </Button>
                  <Button variant="outline" className="w-full">
                    Add Products
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="text-center space-y-3">
                <p>Explore these powerful features:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    Try POS System
                  </Button>
                  <Button variant="outline" size="sm">
                    View Reports
                  </Button>
                  <Button variant="outline" size="sm">
                    Setup Catalog
                  </Button>
                  <Button variant="outline" size="sm">
                    WhatsApp Integration
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center space-y-3">
                <p>You're currently on a <strong>14-day free trial</strong></p>
                <p className="text-sm text-gray-600">
                  Upgrade to unlock unlimited access and advanced features
                </p>
                <div className="space-y-2">
                  <Button className="w-full">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Upgrade Now - Rp 99.000/month
                  </Button>
                  <Button variant="outline" className="w-full">
                    Continue with Trial
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => completeOnboarding()}>
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Skip option */}
          <div className="text-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => completeOnboarding()}
            >
              Skip onboarding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}