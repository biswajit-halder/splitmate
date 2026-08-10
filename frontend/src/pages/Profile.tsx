import { useState } from 'react'

type ProfileTab = 'personal' | 'financial' | 'security'

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal')

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: 'personal', label: 'Personal Details' },
    { key: 'financial', label: 'Financial & Payments' },
    { key: 'security', label: 'Security' },
  ]

  return (
    <div className="flex flex-col gap-xl">
      {/* User Header */}
      <div className="flex items-center gap-lg flex-wrap">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
            <span className="font-headline-lg text-headline-lg text-on-primary">AM</span>
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-surface border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">photo_camera</span>
          </button>
        </div>
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Alex Mercer</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">alex.mercer@example.com</p>
        </div>
        <button className="ml-auto px-md py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors">
          Edit Profile
        </button>
      </div>

      {/* Overview Stats */}
      <div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-md">Overview</h2>
        <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
          <div className="flex items-center gap-md p-lg rounded-xl bg-surface border border-outline-variant/20">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            </div>
            <div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Total Saved</p>
              <p className="font-headline-sm text-headline-sm text-on-surface">$1,240</p>
            </div>
          </div>
          <div className="flex items-center gap-md p-lg rounded-xl bg-surface border border-outline-variant/20">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">group_work</span>
            </div>
            <div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Groups</p>
              <p className="font-headline-sm text-headline-sm text-on-surface">12</p>
            </div>
          </div>
          <div className="flex items-center gap-md p-lg rounded-xl bg-surface border border-outline-variant/20">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-success">handshake</span>
            </div>
            <div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Friends Made</p>
              <p className="font-headline-sm text-headline-sm text-on-surface">45</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-md">Achievements</h2>
        <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
          <div className="flex items-center gap-md p-lg rounded-xl bg-surface border border-outline-variant/20">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">workspace_premium</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface">Super Splitter</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Created 50+ expenses</p>
            </div>
          </div>
          <div className="flex items-center gap-md p-lg rounded-xl bg-surface border border-outline-variant/20">
            <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">bolt</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface">Early Settler</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Settled debts within 24h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant/30">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-lg py-3 font-label-md text-label-md transition-colors ${
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
      </div>

      {/* Tab Content */}
      <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
        {activeTab === 'personal' && (
          <div className="flex flex-col gap-lg max-w-xl">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Personal Details</h3>
            <div className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Full Name</label>
                <input
                  type="text"
                  defaultValue="Alex Mercer"
                  className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Email Address</label>
                <input
                  type="email"
                  defaultValue="alex.mercer@example.com"
                  className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow placeholder-outline-variant"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <div className="flex flex-col gap-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Default Currency</label>
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
                    <option>Pacific Time (PT)</option>
                    <option>Eastern Time (ET)</option>
                    <option>Coordinated Universal Time (UTC)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-md">
              <button className="px-lg py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="flex flex-col gap-lg max-w-xl">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Financial & Payments</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">Manage your payment methods and financial settings.</p>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="flex flex-col gap-lg max-w-xl">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Security</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">Manage your password and security settings.</p>
          </div>
        )}
      </div>
    </div>
  )
}
