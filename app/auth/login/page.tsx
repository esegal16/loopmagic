import { Suspense } from 'react';
import Link from 'next/link';
import { Repeat } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Login - LoopMagic',
  description: 'Sign in to your LoopMagic account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-lm-page flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-lm-dark rounded-lg flex items-center justify-center">
            <Repeat className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-semibold text-xl text-lm-text">LoopMagic</span>
        </Link>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
