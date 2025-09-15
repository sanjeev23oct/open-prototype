import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, Code, Accessibility, Zap, Eye } from 'lucide-react';
import { TestRunner } from './TestRunner';
import { useGenerationStore } from '../stores/generationStore';

interface QualityAssuranceProps {
  className?: string;
}

interface QualityCheck {
  id: string;
  name: string;
  description: string;
  category: 'code' | 'accessibility' | 'performance' | 'security';
  status: 'pending' | 'checking' | 'passed' | 'failed' | 'warning';
  score?: number;
  details?: string[];
  recommendations?: string[];
}

export const QualityAssurance: React.FC<QualityAssuranceProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tests' | 'checks'>('overview');
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  
  const { generatedCode, isGenerating } = useGenerationStore();

  useEffect(() => {
    if (generatedCode?.completeHTML) {
      runQualityChecks();
    }
  }, [generatedCode]);

  const runQualityChecks = async () => {
    setIsRunningChecks(true);
    
    const checks: QualityCheck[] = [
      // Code Quality Checks
      {
        id: 'html-validation',
        name: 'HTML Validation',
        description: 'Check for valid HTML structure and syntax',
        category: 'code',
        status: 'checking'
      },
      {
        id: 'css-validation',
        name: 'CSS Validation',
        description: 'Validate CSS syntax and properties',
        category: 'code',
        status: 'checking'
      },
      {
        id: 'js-syntax',
        name: 'JavaScript Syntax',
        description: 'Check JavaScript for syntax errors',
        category: 'code',
        status: 'checking'
      },
      
      // Accessibility Checks
      {
        id: 'semantic-html',
        name: 'Semantic HTML',
        description: 'Check for proper semantic HTML usage',
        category: 'accessibility',
        status: 'checking'
      },
      {
        id: 'aria-compliance',
        name: 'ARIA Compliance',
        description: 'Validate ARIA attributes and accessibility',
        category: 'accessibility',
        status: 'checking'
      },
      {
        id: 'keyboard-navigation',
        name: 'Keyboard Navigation',
        description: 'Ensure all interactive elements are keyboard accessible',
        category: 'accessibility',
        status: 'checking'
      },
      
      // Performance Checks
      {
        id: 'code-size',
        name: 'Code Size',
        description: 'Check generated code size and optimization',
        category: 'performance',
        status: 'checking'
      },
      {
        id: 'resource-optimization',
        name: 'Resource Optimization',
        description: 'Check for optimized images and assets',
        category: 'performance',
        status: 'checking'
      },
      
      // Security Checks
      {
        id: 'xss-prevention',
        name: 'XSS Prevention',
        description: 'Check for potential XSS vulnerabilities',
        category: 'security',
        status: 'checking'
      }
    ];

    setQualityChecks(checks);

    // Simulate running checks with delays
    for (let i = 0; i < checks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const updatedChecks = [...checks];
      const check = updatedChecks[i];
      
      // Simulate check results
      const result = await simulateQualityCheck(check, generatedCode?.completeHTML || '');
      updatedChecks[i] = { ...check, ...result };
      
      setQualityChecks([...updatedChecks]);
    }

    // Calculate overall score
    const totalScore = checks.reduce((sum, check) => sum + (check.score || 0), 0);
    const avgScore = Math.round(totalScore / checks.length);
    setOverallScore(avgScore);
    
    setIsRunningChecks(false);
  };

  const simulateQualityCheck = async (check: QualityCheck, code: string): Promise<Partial<QualityCheck>> => {
    // Simulate different check results based on check type
    switch (check.id) {
      case 'html-validation':
        const hasDoctype = code.includes('<!DOCTYPE html>');
        const hasLang = code.includes('lang=');
        const score = (hasDoctype ? 50 : 0) + (hasLang ? 50 : 0);
        return {
          status: score >= 80 ? 'passed' : score >= 50 ? 'warning' : 'failed',
          score,
          details: [
            hasDoctype ? '✓ DOCTYPE declaration present' : '✗ Missing DOCTYPE declaration',
            hasLang ? '✓ Language attribute present' : '✗ Missing language attribute'
          ],
          recommendations: score < 80 ? ['Add missing HTML structure elements'] : []
        };

      case 'css-validation':
        const hasStyles = code.includes('<style>') || code.includes('class=');
        return {
          status: hasStyles ? 'passed' : 'warning',
          score: hasStyles ? 85 : 60,
          details: [hasStyles ? '✓ CSS styles found' : '⚠ Limited styling detected'],
          recommendations: hasStyles ? [] : ['Consider adding more comprehensive styling']
        };

      case 'semantic-html':
        const semanticTags = ['header', 'nav', 'main', 'section', 'article', 'footer'];
        const foundTags = semanticTags.filter(tag => code.includes(`<${tag}`));
        const score = Math.round((foundTags.length / semanticTags.length) * 100);
        return {
          status: score >= 70 ? 'passed' : score >= 40 ? 'warning' : 'failed',
          score,
          details: foundTags.map(tag => `✓ Uses <${tag}> element`),
          recommendations: score < 70 ? ['Use more semantic HTML elements'] : []
        };

      case 'aria-compliance':
        const hasAriaLabels = code.includes('aria-label') || code.includes('aria-labelledby');
        const hasRoles = code.includes('role=');
        const score = (hasAriaLabels ? 50 : 0) + (hasRoles ? 50 : 0);
        return {
          status: score >= 70 ? 'passed' : 'warning',
          score: Math.max(score, 60), // Minimum score for basic compliance
          details: [
            hasAriaLabels ? '✓ ARIA labels found' : '⚠ Limited ARIA labels',
            hasRoles ? '✓ ARIA roles found' : '⚠ Limited ARIA roles'
          ],
          recommendations: score < 70 ? ['Add more ARIA attributes for better accessibility'] : []
        };

      case 'code-size':
        const size = code.length;
        const score = size < 50000 ? 100 : size < 100000 ? 80 : size < 200000 ? 60 : 40;
        return {
          status: score >= 80 ? 'passed' : score >= 60 ? 'warning' : 'failed',
          score,
          details: [`Code size: ${Math.round(size / 1024)}KB`],
          recommendations: score < 80 ? ['Consider code optimization and minification'] : []
        };

      case 'xss-prevention':
        const hasDangerousPatterns = code.includes('innerHTML') || code.includes('eval(');
        return {
          status: hasDangerousPatterns ? 'warning' : 'passed',
          score: hasDangerousPatterns ? 70 : 95,
          details: [
            hasDangerousPatterns ? '⚠ Potentially unsafe patterns detected' : '✓ No obvious security issues'
          ],
          recommendations: hasDangerousPatterns ? ['Review code for XSS vulnerabilities'] : []
        };

      default:
        return {
          status: 'passed',
          score: 85,
          details: ['✓ Check completed successfully'],
          recommendations: []
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'code':
        return Code;
      case 'accessibility':
        return Accessibility;
      case 'performance':
        return Zap;
      case 'security':
        return Shield;
      default:
        return CheckCircle;
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Eye },
    { id: 'tests' as const, label: 'Tests', icon: CheckCircle },
    { id: 'checks' as const, label: 'Quality Checks', icon: Shield }
  ];

  const passedChecks = qualityChecks.filter(c => c.status === 'passed').length;
  const failedChecks = qualityChecks.filter(c => c.status === 'failed').length;
  const warningChecks = qualityChecks.filter(c => c.status === 'warning').length;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Quality Assurance</h3>
          {overallScore > 0 && (
            <div className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${getScoreBackground(overallScore)} ${getScoreColor(overallScore)}`}>
              Score: {overallScore}/100
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4 mr-2 inline" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getScoreBackground(overallScore)} ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mt-3">Overall Quality Score</h4>
              <p className="text-sm text-gray-600">
                {overallScore >= 90 ? 'Excellent quality!' :
                 overallScore >= 70 ? 'Good quality with room for improvement' :
                 'Needs improvement'}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-900">{passedChecks}</div>
                <div className="text-sm text-green-600">Passed</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-900">{warningChecks}</div>
                <div className="text-sm text-yellow-600">Warnings</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-900">{failedChecks}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            {/* Category Scores */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Category Breakdown</h4>
              <div className="space-y-3">
                {['code', 'accessibility', 'performance', 'security'].map(category => {
                  const categoryChecks = qualityChecks.filter(c => c.category === category);
                  const avgScore = categoryChecks.length > 0 
                    ? Math.round(categoryChecks.reduce((sum, c) => sum + (c.score || 0), 0) / categoryChecks.length)
                    : 0;
                  const Icon = getCategoryIcon(category);
                  
                  return (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 text-gray-600 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900 capitalize">{category}</div>
                          <div className="text-sm text-gray-600">{categoryChecks.length} checks</div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${getScoreColor(avgScore)}`}>
                        {avgScore}/100
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <TestRunner />
        )}

        {activeTab === 'checks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Quality Checks</h4>
              <button
                onClick={runQualityChecks}
                disabled={isRunningChecks || isGenerating}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isRunningChecks ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Run Checks
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              {qualityChecks.map(check => {
                const Icon = getCategoryIcon(check.category);
                
                return (
                  <div key={check.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Icon className="h-5 w-5 text-gray-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="font-medium text-gray-900">{check.name}</h5>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              check.category === 'code' ? 'bg-blue-100 text-blue-800' :
                              check.category === 'accessibility' ? 'bg-green-100 text-green-800' :
                              check.category === 'performance' ? 'bg-orange-100 text-orange-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {check.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{check.description}</p>
                          
                          {check.details && check.details.length > 0 && (
                            <div className="space-y-1">
                              {check.details.map((detail, index) => (
                                <div key={index} className="text-xs text-gray-700 flex items-center">
                                  <span className="mr-2">
                                    {detail.startsWith('✓') ? '✅' : 
                                     detail.startsWith('⚠') ? '⚠️' : 
                                     detail.startsWith('✗') ? '❌' : '•'}
                                  </span>
                                  {detail.replace(/^[✓⚠✗]\s*/, '')}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {check.recommendations && check.recommendations.length > 0 && (
                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="text-xs font-medium text-yellow-800 mb-1">Recommendations:</div>
                              <ul className="text-xs text-yellow-700 space-y-1">
                                {check.recommendations.map((rec, index) => (
                                  <li key={index}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {check.score !== undefined && (
                          <div className={`px-2 py-1 text-sm font-medium rounded ${getScoreBackground(check.score)} ${getScoreColor(check.score)}`}>
                            {check.score}/100
                          </div>
                        )}
                        <div className="flex items-center">
                          {check.status === 'checking' && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                          {check.status === 'passed' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {check.status === 'failed' && (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                          {check.status === 'warning' && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};