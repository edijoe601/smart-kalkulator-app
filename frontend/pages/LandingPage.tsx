import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SignUpButton, SignInButton } from '@clerk/clerk-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Calculator, 
  Check, 
  Star, 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  Globe, 
  BarChart3,
  Smartphone,
  Clock,
  Shield,
  Headphones
} from 'lucide-react';

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isContactOpen, setIsContactOpen] = useState(false);
  const { toast } = useToast();

  const { data: settings } = useQuery({
    queryKey: ['landing-page-settings'],
    queryFn: () => backend.admin.getLandingPageSettings()
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const features = [
    {
      icon: <Calculator className="w-8 h-8 text-blue-600" />,
      title: "Kalkulator HPP Otomatis",
      description: "Hitung harga pokok produksi secara otomatis berdasarkan resep dan bahan baku"
    },
    {
      icon: <ShoppingCart className="w-8 h-8 text-green-600" />,
      title: "POS System Terintegrasi",
      description: "Sistem kasir modern dengan struk digital dan manajemen inventory real-time"
    },
    {
      icon: <Globe className="w-8 h-8 text-purple-600" />,
      title: "Katalog Online",
      description: "Toko online otomatis dengan integrasi WhatsApp untuk penjualan digital"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
      title: "Laporan Bisnis",
      description: "Dashboard analitik lengkap untuk memantau performa dan pertumbuhan bisnis"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-pink-600" />,
      title: "Mobile Friendly",
      description: "Akses dari mana saja dengan tampilan responsif di semua perangkat"
    },
    {
      icon: <Clock className="w-8 h-8 text-indigo-600" />,
      title: "Real-time Sync",
      description: "Sinkronisasi data real-time antar perangkat dan lokasi"
    }
  ];

  const testimonials = [
    {
      name: "Sari Dewi",
      business: "Warung Makan Sari",
      rating: 5,
      comment: "Smart Kalkulator membantu saya menghitung HPP dengan akurat. Keuntungan meningkat 30% dalam 3 bulan!"
    },
    {
      name: "Budi Santoso",
      business: "Toko Kue Budi",
      rating: 5,
      comment: "Fitur katalog online sangat membantu. Penjualan online naik drastis sejak pakai Smart Kalkulator."
    },
    {
      name: "Maya Indira",
      business: "Catering Maya",
      rating: 5,
      comment: "Laporan bisnis yang detail membantu saya membuat keputusan bisnis yang lebih baik."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Smart Kalkulator</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <SignInButton mode="modal">
                <Button variant="outline">Masuk</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Daftar Gratis</Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800">
              🎉 Trial Gratis {settings?.trialDays || 14} Hari
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {settings?.heroTitle || 'Smart Kalkulator - Solusi POS UKM Terdepan'}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {settings?.heroSubtitle || 'Kelola bisnis UKM Anda dengan sistem POS terintegrasi, katalog online, dan analisis bisnis yang powerful'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                  {settings?.heroCTAText || 'Mulai Trial Gratis'}
                </Button>
              </SignUpButton>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-3"
                onClick={() => setIsContactOpen(true)}
              >
                Hubungi Kami
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Tidak perlu kartu kredit • Setup dalam 5 menit • Support 24/7
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {settings?.featuresTitle || 'Fitur Lengkap untuk Bisnis UKM'}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola dan mengembangkan bisnis UKM dalam satu platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-blue-200 transition-colors">
                <CardContent className="p-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dipercaya Ribuan UKM di Indonesia
            </h2>
            <p className="text-xl text-gray-600">
              Lihat bagaimana Smart Kalkulator membantu bisnis UKM berkembang
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.comment}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.business}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {settings?.pricingTitle || 'Paket Berlangganan'}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Pilih paket yang sesuai dengan kebutuhan bisnis Anda
            </p>
            <div className="flex items-center justify-center space-x-4">
              <span className={selectedPlan === 'monthly' ? 'font-semibold' : 'text-gray-500'}>
                Bulanan
              </span>
              <button
                onClick={() => setSelectedPlan(selectedPlan === 'monthly' ? 'yearly' : 'monthly')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    selectedPlan === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={selectedPlan === 'yearly' ? 'font-semibold' : 'text-gray-500'}>
                Tahunan
                <Badge className="ml-2 bg-green-100 text-green-800">Hemat 17%</Badge>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Trial Plan */}
            <Card className="border-2">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Trial Gratis</CardTitle>
                <div className="text-4xl font-bold text-gray-900">Gratis</div>
                <p className="text-gray-600">{settings?.trialDays || 14} hari pertama</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>Semua fitur lengkap</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>Maksimal 100 produk</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>Support email</span>
                  </li>
                </ul>
                <SignUpButton mode="modal">
                  <Button className="w-full">Mulai Trial</Button>
                </SignUpButton>
              </CardContent>
            </Card>

            {/* Monthly/Yearly Plan */}
            <Card className="border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">Paling Populer</Badge>
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="text-4xl font-bold text-gray-900">
                  {selectedPlan === 'monthly' 
                    ? formatCurrency(settings?.monthlyPrice || 99000)
                    : formatCurrency(settings?.yearlyPrice || 990000)
                  }
                </div>
                <p className="text-gray-600">
                  per {selectedPlan === 'monthly' ? 'bulan' : 'tahun'}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>Semua fitur lengkap</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>Produk unlimited</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>Katalog online</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>WhatsApp integration</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>Support prioritas</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>Backup otomatis</span>
                  </li>
                </ul>
                <SignUpButton mode="modal">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Berlangganan Sekarang
                  </Button>
                </SignUpButton>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-gray-900">Custom</div>
                <p className="text-gray-600">Sesuai kebutuhan</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>Semua fitur Pro</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>Multi-lokasi</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>API access</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>Custom integration</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span>Dedicated support</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsContactOpen(true)}
                >
                  Hubungi Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Siap Mengembangkan Bisnis UKM Anda?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Bergabung dengan ribuan UKM yang sudah merasakan manfaat Smart Kalkulator
          </p>
          <SignUpButton mode="modal">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3">
              Mulai Trial Gratis {settings?.trialDays || 14} Hari
            </Button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold">Smart Kalkulator</h3>
              </div>
              <p className="text-gray-400">
                Solusi POS terdepan untuk UKM Indonesia
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produk</h4>
              <ul className="space-y-2 text-gray-400">
                <li>POS System</li>
                <li>Katalog Online</li>
                <li>Kalkulator HPP</li>
                <li>Laporan Bisnis</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Dukungan</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Panduan Pengguna</li>
                <li>Video Tutorial</li>
                <li>FAQ</li>
                <li>Hubungi Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: {settings?.contactEmail || 'support@smartkalkulator.com'}</li>
                <li>WhatsApp: {settings?.contactPhone || '081234567890'}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Smart Kalkulator. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Contact Dialog */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hubungi Kami</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Headphones className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Customer Support</p>
                <p className="text-sm text-gray-600">Email: {settings?.contactEmail || 'support@smartkalkulator.com'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-gray-600">{settings?.contactPhone || '081234567890'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium">Jam Operasional</p>
                <p className="text-sm text-gray-600">Senin - Jumat: 09:00 - 18:00 WIB</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
