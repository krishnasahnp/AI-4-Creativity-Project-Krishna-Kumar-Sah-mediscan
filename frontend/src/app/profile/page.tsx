'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Shield, Award, MapPin, Calendar, Camera } from 'lucide-react';

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  
  return (
    <AuthGuard>
      <div className="min-h-screen flex" style={{ background: '#0c1222' }}>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
             <div className="max-w-4xl mx-auto">
                <div className="relative h-48 rounded-3xl overflow-hidden mb-16" 
                     style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)' }}>
                   <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
                   
                   <div className="absolute -bottom-12 left-8 flex items-end gap-6">
                      <div className="w-32 h-32 rounded-3xl border-4 border-[#0c1222] bg-[#1e293b] flex items-center justify-center text-4xl font-bold text-teal-400 shadow-2xl relative">
                         {user?.name?.[0]}
                         <button className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-teal-500 text-white hover:bg-teal-400">
                            <Camera className="w-4 h-4" />
                         </button>
                      </div>
                      <div className="mb-4">
                         <h1 className="text-3xl font-bold text-white mb-1">{user?.name}</h1>
                         <p className="text-teal-100/80 font-medium">{user?.role || 'Senior Radiologist'}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                   {/* Personal Info */}
                   <div className="md:col-span-2 space-y-6">
                      <div className="p-6 rounded-2xl border border-[rgba(148,163,184,0.1)] bg-[rgba(26,39,68,0.5)]">
                         <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-teal-400" />
                            Personal Information
                         </h2>
                         <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                               <InfoItem label="Full Name" value={user?.name || 'Dr. Rajesh Kumar'} />
                               <InfoItem label="Email" value={user?.email || 'doctor@hospital.com'} />
                               <InfoItem label="Phone" value="+1 (555) 123-4567" />
                               <InfoItem label="Department" value="Radiology" />
                            </div>
                         </div>
                      </div>

                      <div className="p-6 rounded-2xl border border-[rgba(148,163,184,0.1)] bg-[rgba(26,39,68,0.5)]">
                         <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-purple-400" />
                            Credentials & Activity
                         </h2>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatsCard label="Cases Reviewed" value="1,248" />
                            <StatsCard label="AI Corrections" value="12" />
                            <StatsCard label="Hours Online" value="384" />
                         </div>
                      </div>
                   </div>

                   {/* Sidebar Info */}
                   <div className="space-y-6">
                      <div className="p-6 rounded-2xl border border-[rgba(148,163,184,0.1)] bg-[rgba(26,39,68,0.5)]">
                         <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                            Account Details
                         </h2>
                         <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                               <Shield className="w-4 h-4 text-emerald-400" />
                               <span className="text-white">Admin Privileges</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                               <MapPin className="w-4 h-4 text-blue-400" />
                               <span className="text-white">New York General</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                               <Calendar className="w-4 h-4 text-orange-400" />
                               <span className="text-white">Joined Jan 2024</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
   return (
      <div>
         <p className="text-xs text-slate-400 mb-1">{label}</p>
         <p className="text-sm font-medium text-white">{value}</p>
      </div>
   );
}

function StatsCard({ label, value }: { label: string; value: string }) {
   return (
      <div className="p-4 rounded-xl bg-[rgba(15,23,42,0.3)] border border-[rgba(148,163,184,0.05)] text-center">
         <p className="text-xl font-bold text-white mb-1">{value}</p>
         <p className="text-xs text-slate-400">{label}</p>
      </div>
   );
}
