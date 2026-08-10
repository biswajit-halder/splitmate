import { useState } from 'react'

type SettingsTab = 'general' | 'appearance' | 'notifications' | 'security' | 'payments' | 'privacy' | 'api'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'appearance', label: 'Appearance' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'security', label: 'Security' },
    { key: 'payments', label: 'Payments' },
    { key: 'privacy', label: 'Privacy' },
    { key: 'api', label: 'API Keys' },
  ]

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Settings</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
          Manage your account preferences and configurations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/30 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-lg py-3 font-label-md text-label-md whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
          <div className="max-w-xl">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">General</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-lg">Basic configuration for your account.</p>

            <div className="flex flex-col gap-lg">
              <div className="flex flex-col gap-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Language</label>
                <div className="relative">
                  <select className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow appearance-none">
                    <option>English (US)</option>
                    <option>Español</option>
                    <option>Français</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Default Currency</label>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Used for displaying balances.</p>
                <div className="relative">
                  <select className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow appearance-none">
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Timezone</label>
                <div className="relative">
                  <select className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow appearance-none">
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>Eastern Time (US &amp; Canada)</option>
                    <option>Pacific Time (US &amp; Canada)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="flex justify-end mt-md">
                <button className="px-lg py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs Placeholder */}
      {activeTab !== 'general' && (
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
          <div className="max-w-xl">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">{tabs.find(t => t.key === activeTab)?.label}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Configure your {tabs.find(t => t.key === activeTab)?.label.toLowerCase()} settings here.
            </p>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-xl border-2 border-error/20 bg-error/[0.02] p-lg">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Danger Zone</h3>

        <div className="flex flex-col gap-lg">
          <div className="flex items-center justify-between flex-wrap gap-md p-md rounded-lg bg-surface border border-outline-variant/20">
            <div>
              <p className="font-label-md text-label-md text-on-surface">Export Data</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Download a copy of your personal data.</p>
            </div>
            <button className="flex items-center gap-xs px-md py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export JSON
            </button>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-md p-md rounded-lg bg-surface border border-outline-variant/20">
            <div>
              <p className="font-label-md text-label-md text-error">Delete Account</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Permanently remove your account and all associated data.</p>
            </div>
            <button className="px-md py-2 rounded-lg bg-error text-on-error font-label-md text-label-md hover:opacity-90 transition-opacity">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
