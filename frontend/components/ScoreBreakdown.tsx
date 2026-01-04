interface ScoreBreakdownProps {
  // Accept either individual props or scores object
  fameVisibility?: number;
  scientificSignificance?: number;
  rarity?: number;
  discoveryRecency?: number;
  culturalImpact?: number;
  scores?: {
    fame: number;
    significance: number;
    rarity: number;
    discoveryRecency: number;
    culturalImpact: number;
  };
  totalScore?: number;
}

interface CategoryInfo {
  name: string;
  value: number;
  color: string;
  description: string;
}

export default function ScoreBreakdown(props: ScoreBreakdownProps) {
  // Handle both prop styles
  const fameVisibility = props.scores?.fame ?? props.fameVisibility ?? 0;
  const scientificSignificance = props.scores?.significance ?? props.scientificSignificance ?? 0;
  const rarity = props.scores?.rarity ?? props.rarity ?? 0;
  const discoveryRecency = props.scores?.discoveryRecency ?? props.discoveryRecency ?? 0;
  const culturalImpact = props.scores?.culturalImpact ?? props.culturalImpact ?? 0;

  const categories: CategoryInfo[] = [
    {
      name: 'Distance',
      value: fameVisibility,
      color: 'bg-blue-500',
      description: 'Distance from Earth (light-years)',
    },
    {
      name: 'Mass',
      value: scientificSignificance,
      color: 'bg-purple-500',
      description: 'Object mass (solar masses)',
    },
    {
      name: 'Luminosity',
      value: rarity,
      color: 'bg-yellow-500',
      description: 'Brightness and luminosity',
    },
    {
      name: 'Temperature',
      value: discoveryRecency,
      color: 'bg-green-500',
      description: 'Surface or core temperature (Kelvin)',
    },
    {
      name: 'Discovery',
      value: culturalImpact,
      color: 'bg-pink-500',
      description: 'Historical discovery significance',
    },
  ];

  const totalScore = props.totalScore ?? (
    fameVisibility +
    scientificSignificance +
    rarity +
    discoveryRecency +
    culturalImpact
  );

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.name}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-300 text-sm">{category.name}</span>
            <span className="text-white font-semibold">{category.value}/100</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${category.color} rounded-full transition-all duration-500`}
              style={{ width: `${category.value}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs mt-1">{category.description}</p>
        </div>
      ))}

      {/* Total Score */}
      <div className="pt-4 border-t border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total Cosmic Score</span>
          <span className="text-2xl font-bold text-blue-400">{totalScore}/500</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${(totalScore / 500) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
