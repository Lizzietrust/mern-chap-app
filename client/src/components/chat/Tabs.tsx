interface TabsProps<T extends string> {
  tabs: Array<{
    id: T;
    label: string;
    count?: number;
  }>;
  activeTab: T;
  onTabChange: (tabId: T) => void;
  isDark: boolean;
}

export const Tabs = <T extends string>({
  tabs,
  activeTab,
  onTabChange,
  isDark,
}: TabsProps<T>) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-500"
                : `border-transparent ${
                    isDark
                      ? "text-gray-400 hover:text-gray-300"
                      : "text-gray-500 hover:text-gray-700"
                  }`
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
