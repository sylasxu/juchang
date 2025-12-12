interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon: string;
  iconBg: string;
}

export default function StatCard({ title, value, change, icon, iconBg }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${
            change.type === 'increase' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change.type === 'increase' ? '+' : ''}{change.value}
          </span>
          <span className="text-sm text-gray-500 ml-2">{change.period}</span>
        </div>
      )}
    </div>
  );
}