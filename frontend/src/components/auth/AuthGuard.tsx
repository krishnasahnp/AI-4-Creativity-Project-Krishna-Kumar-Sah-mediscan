'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Activity } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c1222] flex items-center justify-center flex-col gap-4">
        <div className="w-16 h-16 relative">
           <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-teal-500 animate-spin" />
           <div className="absolute inset-2 rounded-full border-t-2 border-l-2 border-blue-500 animate-spin-reverse" />
        </div>
        <p className="text-slate-400 font-medium animate-pulse">Verifying Session...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
