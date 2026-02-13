import Link from 'next/link';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata = {
  title: 'Sign Up - LoopMagic',
  description: 'Create your LoopMagic account',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="font-semibold text-xl text-gray-900">LoopMagic</span>
        </Link>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center p-6">
        <SignupForm />
      </main>
    </div>
  );
}
