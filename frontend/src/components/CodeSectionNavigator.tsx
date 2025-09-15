import React, { useState, useEffect } from 'react';
import { Hash, Search, Filter, ChevronRight, Code, Palette, Zap } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';

interface CodeSectionNavigatorProps {
  onSectionSelect?: (section: CodeSection) => void;
  className?: string;
}

interface CodeSection {
  id: string;
  name: string;
  type: 'element' | 'class' | 'function' | 'style';
  line: number;
  content: string;
  parent?: string;
}

export const CodeSectionNavigator: React.FC<CodeSectionNavigatorProps> = ({
  onSectionSelect,
  className = ''
}) => {
  const [sections, setSections] = useState<CodeSection[]>([]);
  const [filteredSections, setFilteredSections] = useState<CodeSection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'element' | 'class' | 'function' | 'style'>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const { generatedCode } = useGenerationStore();

  // Parse code and extract sections
  useEffect(() => {
    if (generatedCode?.completeHTML) {
      parseCodeSections(generatedCode.completeHTML);
    }
  }, [generatedCode]);

  // Filter sections based on search and type
  useEffect(() => {
    let filtered = sections;

    if (searchTerm) {
      filtered = filtered.filter(section =>
        section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(section => section.type === filterType);
    }

    setFilteredSections(filtered);
  }, [sections, searchTerm, filterType]);

  const parseCodeSections = (html: string) => {
    const parsedSections: CodeSection[] = [];
    const lines = html.split('\n');

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Parse HTML elements
      const elementMatch = trimmedLine.match(/<(\w+)(?:\s+[^>]*)?(?:\s+id=["']([^"']+)["'])?(?:\s+class=["']([^"']+)["'])?[^>]*>/);
      if (elementMatch && !trimmedLine.startsWith('</')) {
        const [, tagName, id, className] = elementMatch;
        
        parsedSections.push({
          id: `element-${index}`,
          name: id || `${tagName}${className ? `.${className.split(' ')[0]}` : ''}`,
          type: 'element',
          line: index + 1,
          content: trimmedLine,
          parent: tagName
        });
      }

      // Parse CSS classes
      const classMatch = trimmedLine.match(/\.([a-zA-Z][\w-]*)\s*\{/);
      if (classMatch) {
        parsedSections.push({
          id: `class-${index}`,
          name: `.${classMatch[1]}`,
          type: 'class',
          line: index + 1,
          content: trimmedLine
        });
      }

      // Parse JavaScript functions
      const functionMatch = trimmedLine.match(/function\s+(\w+)\s*\(|const\s+(\w+)\s*=.*=>/);
      if (functionMatch) {
        const functionName = functionMatch[1] || functionMatch[2];
        parsedSections.push({
          id: `function-${index}`,
          name: `${functionName}()`,
          type: 'function',
          line: index + 1,
          content: trimmedLine
        });
      }

      // Parse CSS custom properties
      const customPropMatch = trimmedLine.match(/--([a-zA-Z][\w-]*)\s*:/);
      if (customPropMatch) {
        parsedSections.push({
          id: `style-${index}`,
          name: `--${customPropMatch[1]}`,
          type: 'style',
          line: index + 1,
          content: trimmedLine
        });
      }
    });

    setSections(parsedSections);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleSectionClick = (section: CodeSection) => {
    onSectionSelect?.(section);
  };

  const getSectionIcon = (type: CodeSection['type']) => {
    switch (type) {
      case 'element': return Code;
      case 'class': return Palette;
      case 'function': return Zap;
      case 'style': return Hash;
      default: return Code;
    }
  };

  const getSectionColor = (type: CodeSection['type']) => {
    switch (type) {
      case 'element': return 'text-blue-600';
      case 'class': return 'text-green-600';
      case 'function': return 'text-purple-600';
      case 'style': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const groupedSections = filteredSections.reduce((groups, section) => {
    const key = section.parent || section.type;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(section);
    return groups;
  }, {} as Record<string, CodeSection[]>);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Code Navigator</h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {filteredSections.length} sections
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sections..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="element">Elements</option>
            <option value="class">Classes</option>
            <option value="function">Functions</option>
            <option value="style">Styles</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {Object.keys(groupedSections).length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Code className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No code sections found</p>
            <p className="text-sm mt-1">Generate content to see navigation</p>
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedSections).map(([groupName, groupSections]) => (
              <div key={groupName} className="mb-2">
                {/* Group Header */}
                <button
                  onClick={() => toggleSection(groupName)}
                  className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="flex items-center">
                    <ChevronRight 
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        expandedSections.has(groupName) ? 'rotate-90' : ''
                      }`} 
                    />
                    <span className="ml-2 font-medium text-gray-700 capitalize">
                      {groupName} ({groupSections.length})
                    </span>
                  </div>
                </button>

                {/* Group Items */}
                {expandedSections.has(groupName) && (
                  <div className="ml-6 space-y-1">
                    {groupSections.map((section) => {
                      const Icon = getSectionIcon(section.type);
                      const colorClass = getSectionColor(section.type);
                      
                      return (
                        <button
                          key={section.id}
                          onClick={() => handleSectionClick(section)}
                          className="w-full flex items-center justify-between p-2 text-left hover:bg-blue-50 rounded-md transition-colors group"
                        >
                          <div className="flex items-center min-w-0 flex-1">
                            <Icon className={`h-4 w-4 ${colorClass} mr-2 flex-shrink-0`} />
                            <span className="text-sm text-gray-900 truncate">
                              {section.name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            L{section.line}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Total: {sections.length}</span>
            {searchTerm && <span>Filtered: {filteredSections.length}</span>}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
              <span>Elements</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span>Classes</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
              <span>Functions</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
              <span>Styles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};