import { useState, ReactNode } from 'react'
import { 
  Tv, 
  Settings, 
  Palette, 
  Sliders, 
  CheckCircle 
} from 'lucide-react'

export type SettingsTabId = 'dashboard' | 'admin' | 'appearance' | 'advanced'

interface Tab {
  id: SettingsTabId
  label: string
  icon: React.ComponentType<{ className?: string }>
  content: ReactNode
}

interface SettingsTabsProps {
  tabs: Tab[]
  defaultTab?: SettingsTabId
  hasChanges?: boolean
  onTabChange?: (tabId: SettingsTabId) => void
}

export function SettingsTabs({ 
  tabs, 
  defaultTab = 'dashboard', 
  hasChanges = false,
  onTabChange,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(defaultTab)

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2.5 px-5 py-3 font-semibold text-sm transition-all duration-200 whitespace-nowrap
                relative focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl
                ${
                  isActive
                    ? 'text-white bg-white/10 border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                }
              `}
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.id}`}
              role="tab"
              tabIndex={isActive ? 0 : -1}
            >
              <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span>{tab.label}</span>
              {isActive && hasChanges && (
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div 
        id={`tab-panel-${activeTab}`}
        role="tabpanel"
        className="flex-1 overflow-y-auto"
      >
        {activeTabContent}
      </div>
    </div>
  )
}
