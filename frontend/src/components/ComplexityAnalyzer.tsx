import React from 'react';
import { BarChart3, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { GenerationPlan, ComponentPlan } from '../types/generation';

interface ComplexityAnalyzerProps {
  plan: GenerationPlan;
}

export const ComplexityAnalyzer: React.FC<ComplexityAnalyzerProps> = ({ plan }) => {
  const getComplexityScore = (complexity: ComponentPlan['estimatedComplexity']) => {
    switch (complexity) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 2;
    }
  };

  const getComplexityStats = () => {
    const stats = {
      low: plan.components.filter(c => c.estimatedComplexity === 'low').length,
      medium: plan.components.filter(c => c.estimatedComplexity === 'medium').length,
      high: plan.components.filter(c => c.estimatedComplexity === 'high').length,
    };

    const totalScore = plan.components.reduce((sum, comp) => 
      sum + getComplexityScore(comp.estimatedComplexity), 0
    );

    const averageComplexity = totalScore / plan.components.length;
    
    return { ...stats, totalScore, averageComplexity };
  };

  const getTypeDistribution = () => {
    const types = plan.components.reduce((acc, comp) => {
      acc[comp.type] = (acc[comp.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(types).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / plan.components.length) * 100),
    }));
  };

  const getRiskAssessment = () => {
    const stats = getComplexityStats();
    const highComplexityRatio = stats.high / plan.components.length;
    const totalComplexity = stats.totalScore;

    if (highComplexityRatio > 0.5 || totalComplexity > plan.components.length * 2.5) {
      return {
        level: 'high',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: AlertTriangle,
        message: 'High complexity project. Consider breaking into phases.',
        recommendations: [
          'Start with low complexity components first',
          'Consider splitting high complexity components',
          'Allow extra time for testing and refinement',
        ],
      };
    } else if (highComplexityRatio > 0.3 || totalComplexity > plan.components.length * 1.8) {
      return {
        level: 'medium',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: Clock,
        message: 'Moderate complexity. Good balance of features.',
        recommendations: [
          'Timeline estimate should be accurate',
          'Monitor progress during generation',
          'Be prepared for minor adjustments',
        ],
      };
    } else {
      return {
        level: 'low',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckCircle,
        message: 'Low complexity project. Should generate smoothly.',
        recommendations: [
          'Fast generation expected',
          'Minimal manual adjustments needed',
          'Good candidate for automation',
        ],
      };
    }
  };

  const stats = getComplexityStats();
  const typeDistribution = getTypeDistribution();
  const riskAssessment = getRiskAssessment();
  const RiskIcon = riskAssessment.icon;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">Complexity Analysis</h3>
      </div>

      {/* Risk Assessment */}
      <div className={`border rounded-lg p-4 mb-6 ${riskAssessment.borderColor} ${riskAssessment.bgColor}`}>
        <div className="flex items-start">
          <RiskIcon className={`h-5 w-5 mr-3 mt-0.5 ${riskAssessment.color}`} />
          <div className="flex-1">
            <h4 className={`font-medium ${riskAssessment.color}`}>
              {riskAssessment.level.charAt(0).toUpperCase() + riskAssessment.level.slice(1)} Complexity
            </h4>
            <p className="text-sm text-gray-700 mt-1">{riskAssessment.message}</p>
            
            <div className="mt-3">
              <div className="text-xs font-medium text-gray-700 mb-2">Recommendations:</div>
              <ul className="text-xs text-gray-600 space-y-1">
                {riskAssessment.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Complexity Distribution */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Complexity Distribution</h4>
        <div className="space-y-3">
          {[
            { level: 'low', count: stats.low, color: 'bg-green-500', label: 'Low Complexity' },
            { level: 'medium', count: stats.medium, color: 'bg-yellow-500', label: 'Medium Complexity' },
            { level: 'high', count: stats.high, color: 'bg-red-500', label: 'High Complexity' },
          ].map(({ level, count, color, label }) => {
            const percentage = Math.round((count / plan.components.length) * 100);
            return (
              <div key={level} className="flex items-center">
                <div className="w-20 text-sm text-gray-600">{label}</div>
                <div className="flex-1 mx-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${color} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-sm text-gray-900 text-right">
                  {count} ({percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Component Type Distribution */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Component Types</h4>
        <div className="grid grid-cols-2 gap-3">
          {typeDistribution.map(({ type, count, percentage }) => (
            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <span className="text-lg mr-2">
                  {type === 'layout' ? '🏗️' : 
                   type === 'component' ? '🧩' : 
                   type === 'feature' ? '⚡' : '🔧'}
                </span>
                <span className="text-sm font-medium text-gray-900 capitalize">{type}</span>
              </div>
              <div className="text-sm text-gray-600">
                {count} ({percentage}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.totalScore}</div>
          <div className="text-xs text-gray-600">Total Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.averageComplexity.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600">Avg Complexity</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(plan.timeline.estimatedMinutes / plan.components.length)}m
          </div>
          <div className="text-xs text-gray-600">Per Component</div>
        </div>
      </div>
    </div>
  );
};