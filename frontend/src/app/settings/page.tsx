'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { useAuthStore } from '@/store';

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuthStore();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            <div className="grid grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="col-span-1">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'bg-[var(--color-accent-primary)] text-white'
                            : 'hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Content */}
              <div className="col-span-3">
                {activeTab === 'profile' && <ProfileSettings user={user} />}
                {activeTab === 'notifications' && <NotificationSettings />}
                {activeTab === 'appearance' && <AppearanceSettings />}
                {activeTab === 'security' && <SecuritySettings />}
                {activeTab === 'preferences' && <PreferenceSettings />}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function ProfileSettings({ user }: { user: any }) {
  return (
    <div className="card space-y-6">
      <h2 className="text-lg font-semibold">Profile Information</h2>
      
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-2xl font-bold text-white">
          {user?.full_name?.charAt(0) || 'U'}
        </div>
        <div>
          <button className="btn btn-secondary text-sm">Change Avatar</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--color-text-muted)] mb-2">Full Name</label>
          <input
            type="text"
            className="input w-full"
            defaultValue={user?.full_name || ''}
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--color-text-muted)] mb-2">Email</label>
          <input
            type="email"
            className="input w-full"
            defaultValue={user?.email || ''}
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--color-text-muted)] mb-2">Role</label>
          <input
            type="text"
            className="input w-full"
            defaultValue={user?.role || 'Clinician'}
            disabled
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--color-text-muted)] mb-2">Department</label>
          <input
            type="text"
            className="input w-full"
            defaultValue="Radiology"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--color-border)]">
        <button className="btn btn-primary">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="card space-y-6">
      <h2 className="text-lg font-semibold">Notification Preferences</h2>
      
      <div className="space-y-4">
        <ToggleSetting
          label="Email Notifications"
          description="Receive email for important updates"
          defaultChecked={true}
        />
        <ToggleSetting
          label="AI Analysis Complete"
          description="Notify when AI processing finishes"
          defaultChecked={true}
        />
        <ToggleSetting
          label="Report Pending Signature"
          description="Reminder for unsigned reports"
          defaultChecked={false}
        />
        <ToggleSetting
          label="System Updates"
          description="News about platform updates"
          defaultChecked={true}
        />
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState('dark');

  return (
    <div className="card space-y-6">
      <h2 className="text-lg font-semibold">Appearance</h2>
      
      <div>
        <label className="block text-sm text-[var(--color-text-muted)] mb-3">Theme</label>
        <div className="flex gap-3">
          <ThemeOption
            icon={Moon}
            label="Dark"
            active={theme === 'dark'}
            onClick={() => setTheme('dark')}
          />
          <ThemeOption
            icon={Sun}
            label="Light"
            active={theme === 'light'}
            onClick={() => setTheme('light')}
          />
          <ThemeOption
            icon={Monitor}
            label="System"
            active={theme === 'system'}
            onClick={() => setTheme('system')}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-[var(--color-text-muted)] mb-2">
          Accent Color
        </label>
        <div className="flex gap-2">
          {['blue', 'purple', 'green', 'orange'].map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full bg-${color}-500 ring-2 ring-offset-2 ring-offset-[var(--color-bg-secondary)] ${
                color === 'blue' ? 'ring-white' : 'ring-transparent'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="card space-y-6">
      <h2 className="text-lg font-semibold">Security</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--color-text-muted)] mb-2">
            Current Password
          </label>
          <input type="password" className="input w-full" />
        </div>
        <div>
          <label className="block text-sm text-[var(--color-text-muted)] mb-2">
            New Password
          </label>
          <input type="password" className="input w-full" />
        </div>
        <div>
          <label className="block text-sm text-[var(--color-text-muted)] mb-2">
            Confirm New Password
          </label>
          <input type="password" className="input w-full" />
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--color-border)]">
        <button className="btn btn-primary">Update Password</button>
      </div>

      <div className="pt-4 border-t border-[var(--color-border)]">
        <h3 className="font-medium mb-3">Two-Factor Authentication</h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-3">
          Add an extra layer of security to your account
        </p>
        <button className="btn btn-secondary">Enable 2FA</button>
      </div>
    </div>
  );
}

function PreferenceSettings() {
  return (
    <div className="card space-y-6">
      <h2 className="text-lg font-semibold">Preferences</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--color-text-muted)] mb-2">
            Default Window Preset
          </label>
          <select className="input w-full">
            <option value="lung">Lung</option>
            <option value="brain">Brain</option>
            <option value="bone">Bone</option>
            <option value="soft_tissue">Soft Tissue</option>
          </select>
        </div>

        <ToggleSetting
          label="Auto-start AI Analysis"
          description="Automatically start analysis after upload"
          defaultChecked={true}
        />

        <ToggleSetting
          label="Voice Dictation"
          description="Enable voice input for reports"
          defaultChecked={false}
        />

        <div>
          <label className="block text-sm text-[var(--color-text-muted)] mb-2">
            Report Template
          </label>
          <select className="input w-full">
            <option value="standard">Standard Radiology</option>
            <option value="brief">Brief Summary</option>
            <option value="detailed">Detailed Analysis</option>
          </select>
        </div>
      </div>
    </div>
  );
}

interface ToggleSettingProps {
  label: string;
  description: string;
  defaultChecked: boolean;
}

function ToggleSetting({ label, description, defaultChecked }: ToggleSettingProps) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`w-12 h-6 rounded-full p-1 transition-colors ${
          checked ? 'bg-[var(--color-accent-primary)]' : 'bg-[var(--color-bg-tertiary)]'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

interface ThemeOptionProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

function ThemeOption({ icon: Icon, label, active, onClick }: ThemeOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
        active
          ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
          : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm">{label}</span>
    </button>
  );
}
