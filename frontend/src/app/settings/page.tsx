'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AuthGuard from '@/components/auth/AuthGuard';
import { 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  Smartphone, 
  Mail, 
  Lock,
  Eye,
  Save,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: true,
    twoFactor: true,
    publicProfile: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast.success('Settings saved successfully');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex" style={{ background: '#0c1222' }}>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-8">
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#f1f5f9]">Settings</h1>
                  <p className="text-[#94a3b8]">Manage your preferences and account security</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                    boxShadow: '0 4px 20px rgba(13, 148, 136, 0.3)',
                  }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Changes
                </button>
              </div>

              {/* General Settings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Notifications */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl border border-[rgba(148,163,184,0.1)] bg-[rgba(26,39,68,0.5)]"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Notifications</h2>
                  </div>

                  <div className="space-y-4">
                    <ToggleItem 
                      icon={Mail}
                      title="Email Notifications"
                      desc="Receive daily summaries and alerts"
                      checked={settings.emailNotifications}
                      onChange={() => handleToggle('emailNotifications')}
                    />
                    <ToggleItem 
                      icon={Smartphone}
                      title="Push Notifications"
                      desc="Instant alerts on your mobile device"
                      checked={settings.pushNotifications}
                      onChange={() => handleToggle('pushNotifications')}
                    />
                  </div>
                </motion.div>

                {/* Security */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 rounded-2xl border border-[rgba(148,163,184,0.1)] bg-[rgba(26,39,68,0.5)]"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Security</h2>
                  </div>

                  <div className="space-y-4">
                    <ToggleItem 
                      icon={Lock}
                      title="Two-Factor Auth"
                      desc="Add an extra layer of security"
                      checked={settings.twoFactor}
                      onChange={() => handleToggle('twoFactor')}
                    />
                    <ToggleItem 
                      icon={Eye}
                      title="Public Profile"
                      desc="Allow other doctors to find you"
                      checked={settings.publicProfile}
                      onChange={() => handleToggle('publicProfile')}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Preferences */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-2xl border border-[rgba(148,163,184,0.1)] bg-[rgba(26,39,68,0.5)]"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Preferences</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(15,23,42,0.3)] border border-[rgba(148,163,184,0.05)]">
                       <div className="flex items-center gap-3">
                          <Moon className="w-5 h-5 text-slate-400" />
                          <div>
                             <p className="font-medium text-white">Dark Mode</p>
                             <p className="text-xs text-slate-500">System default</p>
                          </div>
                       </div>
                       <button className="text-sm text-teal-400 font-medium">Manage</button>
                    </div>
                  </div>
                </motion.div>

            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

function ToggleItem({ icon: Icon, title, desc, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(15,23,42,0.3)] border border-[rgba(148,163,184,0.05)] hover:border-[rgba(148,163,184,0.1)] transition-all">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-slate-400" />
        <div>
          <p className="font-medium text-white">{title}</p>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
      <button 
        onClick={onChange}
        className={`w-12 h-6 rounded-full relative transition-colors ${checked ? 'bg-teal-500' : 'bg-slate-700'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}
