import React, { useEffect, useState } from 'react';

interface MoodPoint {
  timestamp: Date;
  stressLevel: number;
  moodType: string;
}

interface MoodTrackingDashboardProps {
  moodHistory: MoodPoint[];
  className?: string;
}

export default function MoodTrackingDashboard({ moodHistory, className = '' }: MoodTrackingDashboardProps) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [insights, setInsights] = useState<{
    averageStress: number;
    trend: 'improving' | 'stable' | 'concerning';
    peakTimes: string[];
    recommendations: string[];
  } | null>(null);

  // Filter data based on time range
  const getFilteredData = () => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeRange) {
      case '24h':
        cutoff.setHours(now.getHours() - 24);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(now.getDate() - 30);
        break;
    }
    
    return moodHistory.filter(point => point.timestamp >= cutoff);
  };

  // Generate chart data for custom chart
  const getChartPoints = () => {
    const filteredData = getFilteredData();
    const width = 600;
    const height = 200;
    
    if (filteredData.length === 0) return { points: [], width, height };
    
    const points = filteredData.map((point, index) => {
      const x = (index / Math.max(1, filteredData.length - 1)) * (width - 40) + 20;
      const y = height - 20 - ((point.stressLevel / 10) * (height - 40));
      
      return {
        x,
        y,
        level: point.stressLevel,
        mood: point.moodType,
        time: point.timestamp
      };
    });
    
    return { points, width, height };
  };

  // Custom SVG Chart Component
  const CustomChart = () => {
    const { points, width, height } = getChartPoints();
    
    if (points.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          No data available for selected time range
        </div>
      );
    }
    
    // Create path string for the line
    const pathData = points.reduce((path, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '');
    
    // Create area path for fill
    const areaPath = `${pathData} L ${points[points.length - 1].x} ${height - 20} L ${points[0].x} ${height - 20} Z`;
    
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="border rounded-lg">
        {/* Grid lines */}
        {[0, 2, 4, 6, 8, 10].map(level => {
          const y = height - 20 - ((level / 10) * (height - 40));
          return (
            <g key={level}>
              <line
                x1={20}
                y1={y}
                x2={width - 20}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray={level === 0 ? "none" : "2,2"}
              />
              <text x={10} y={y + 4} fontSize="12" fill="#6b7280" textAnchor="middle">
                {level}
              </text>
            </g>
          );
        })}
        
        {/* Area fill */}
        <path
          d={areaPath}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="none"
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {points.map((point, index) => {
          const color = point.level >= 7 ? '#ef4444' : 
                       point.level >= 5 ? '#f59e0b' : '#22c55e';
          
          return (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="5"
              fill={color}
              stroke="white"
              strokeWidth="2"
              className="hover:r-6 cursor-pointer"
            >
              <title>{`${point.mood}: ${point.level}/10`}</title>
            </circle>
          );
        })}
        
        {/* Y-axis labels */}
        <text x={width / 2} y={15} fontSize="14" fill="#1f2937" textAnchor="middle" fontWeight="bold">
          Stress Level Tracking ({timeRange.toUpperCase()})
        </text>
      </svg>
    );
  };

  // Calculate insights
  useEffect(() => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return;

    const stressLevels = filteredData.map(p => p.stressLevel);
    const averageStress = stressLevels.reduce((sum, level) => sum + level, 0) / stressLevels.length;
    
    // Calculate trend
    const firstHalf = stressLevels.slice(0, Math.floor(stressLevels.length / 2));
    const secondHalf = stressLevels.slice(Math.floor(stressLevels.length / 2));
    const firstAvg = firstHalf.reduce((sum, level) => sum + level, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, level) => sum + level, 0) / secondHalf.length;
    
    let trend: 'improving' | 'stable' | 'concerning';
    if (secondAvg < firstAvg - 1) trend = 'improving';
    else if (secondAvg > firstAvg + 1) trend = 'concerning';
    else trend = 'stable';

    // Find peak stress times
    const highStressTimes = filteredData
      .filter(point => point.stressLevel >= 7)
      .map(point => {
        const hour = point.timestamp.getHours();
        if (hour < 6) return 'Late Night';
        if (hour < 12) return 'Morning';
        if (hour < 18) return 'Afternoon';
        return 'Evening';
      });
    
    const peakTimes = Array.from(new Set(highStressTimes));

    // Generate recommendations
    const recommendations = [];
    if (averageStress > 6) {
      recommendations.push('Consider speaking with a counselor or therapist');
      recommendations.push('Practice daily stress management techniques');
    }
    if (peakTimes.length > 0) {
      recommendations.push(`Pay attention to stress during: ${peakTimes.join(', ')}`);
    }
    if (trend === 'concerning') {
      recommendations.push('Your stress levels are increasing - prioritize self-care');
    } else if (trend === 'improving') {
      recommendations.push('Great progress! Keep up your current coping strategies');
    }

    setInsights({
      averageStress: Math.round(averageStress * 10) / 10,
      trend,
      peakTimes,
      recommendations
    });
  }, [moodHistory, timeRange]);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'concerning': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'concerning': return '📉';
      default: return '📊';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mood Dashboard</h2>
        <div className="flex space-x-2">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        <CustomChart />
      </div>

      {/* Insights */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Insights</h3>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">{insights.averageStress}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Stress Level</p>
                <p className="text-lg font-medium">
                  {insights.averageStress < 3 ? 'Low' : 
                   insights.averageStress < 6 ? 'Moderate' : 'High'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">{getTrendIcon(insights.trend)}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trend</p>
                <p className={`text-lg font-medium ${getTrendColor(insights.trend)}`}>
                  {insights.trend.charAt(0).toUpperCase() + insights.trend.slice(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
            <div className="space-y-2">
              {insights.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
            
            {insights.peakTimes.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Peak Stress Times:</strong> {insights.peakTimes.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Support Button */}
      {insights && insights.averageStress > 6 && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-red-800 font-medium">Need Support?</h4>
              <p className="text-red-700 text-sm">Your stress levels have been consistently high.</p>
            </div>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              Get Help
            </button>
          </div>
        </div>
      )}
    </div>
  );
}