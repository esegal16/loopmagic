import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Navbar } from '@/components/layout/Navbar';
import { Repeat } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-lm-page">
      <Navbar user={user} />

      {/* Hero Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 text-center">
        <h1 className="text-5xl font-heading font-bold text-lm-text tracking-tight leading-tight">
          Analyze Real Estate Deals
          <br />
          <span className="text-lm-green">In Seconds, Not Hours</span>
        </h1>
        <p className="mt-6 text-xl text-lm-text-secondary max-w-2xl mx-auto">
          Paste a LoopNet URL and get a full proforma, AI-powered investment memo,
          and buy/pass recommendation.
        </p>
        <div className="mt-10">
          <Link href={user ? '/dashboard' : '/auth/signup'}>
            <Button size="lg">
              {user ? 'Go to Dashboard' : 'Get Started Free'}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-lm-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-lm-dark rounded-lg flex items-center justify-center">
                <Repeat className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-heading font-semibold text-lg text-lm-text">LoopMagic</span>
            </div>
            <p className="text-sm text-lm-text-tertiary">
              &copy; {new Date().getFullYear()} LoopMagic
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
