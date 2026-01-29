'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, ArrowRight, Activity, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@medivision.com');
  const [password, setPassword] = useState('admin123');
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate network delay for effect
    await new Promise(resolve => setTimeout(resolve, 1500));

    const success = await login(email, password);
    
    if (success) {
      toast.success('Welcome back, Dr. Kumar');
      router.push('/');
    } else {
      toast.error('Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1222] flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md z-10 px-4">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="bg-[#1e293b]/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Animated decorative line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-50" />

          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-teal-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
               <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">MediVision AI</h1>
            <p className="text-slate-400">Secure Medical Imaging Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 focus:border-teal-500 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                  placeholder="doctor@hospital.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 focus:border-teal-500 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
               <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-[#0f172a] text-teal-500 focus:ring-offset-0 focus:ring-teal-500" />
                  Remember me
               </label>
               <a href="#" className="text-teal-400 hover:text-teal-300 font-medium">Forgot Password?</a>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Access Portal
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-slate-500 text-xs flex items-center justify-center gap-2">
              <Cpu className="w-3 h-3" />
              Powered by MediCortex Neural Engine v2.4
            </p>
          </div>
        </motion.div>
        
        <div className="mt-6 text-center text-slate-500 text-sm">
           <p>Default Access: <span className="text-teal-400 font-mono bg-teal-500/10 px-1 rounded">admin@medivision.com</span> / <span className="text-teal-400 font-mono bg-teal-500/10 px-1 rounded">admin123</span></p>
        </div>
      </div>
    </div>
  );
}
