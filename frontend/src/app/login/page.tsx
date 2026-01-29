'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Stethoscope, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Mock login - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: '1',
        email,
        full_name: 'Dr. Rajesh Kumar',
        role: 'clinician'
      };
      
      login(mockUser, 'mock-access-token', 'mock-refresh-token');
      router.push('/');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">MediVision AI</span>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              AI-Powered Medical Imaging Analysis
            </h1>
            <p className="text-xl text-white/80">
              Intelligent CT and Ultrasound analysis with explainable AI, 
              automated reporting, and voice-enabled workflow.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              ✓
            </div>
            <span>AI-assisted findings detection</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              ✓
            </div>
            <span>Automated report generation</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              ✓
            </div>
            <span>Voice dictation support</span>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">MediVision AI</span>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Sign in to continue to your dashboard
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                  <input
                    type="email"
                    className="input pl-11 w-full"
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-11 pr-11 w-full"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>
                <a href="#" className="text-sm text-[var(--color-accent-primary)] hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-3"
              >
                {isLoading ? (
                  <span className="animate-pulse">Signing in...</span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[var(--color-border)] text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Don't have an account?{' '}
                <a href="/register" className="text-[var(--color-accent-primary)] hover:underline">
                  Request access
                </a>
              </p>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Demo: Any email & password will work
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
