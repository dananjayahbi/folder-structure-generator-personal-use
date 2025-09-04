'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder as FolderIcon, FolderOpen, MoreHorizontal } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  truncated?: boolean;
  totalCount?: number;
}

interface FolderTreeProps {
  data: FileNode[];
  level?: number;
}

interface TreeNodeProps {
  node: FileNode;
  level?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.type === 'folder' && node.children && node.children.length > 0;

  const toggleExpand = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Common file type icons
    const iconMap: Record<string, string> = {
      'js': 'text-yellow-600',
      'ts': 'text-blue-600',
      'jsx': 'text-cyan-600',
      'tsx': 'text-cyan-600',
      'json': 'text-green-600',
      'md': 'text-blue-500',
      'css': 'text-pink-600',
      'scss': 'text-pink-700',
      'html': 'text-orange-600',
      'py': 'text-blue-500',
      'java': 'text-red-600',
      'cpp': 'text-purple-600',
      'c': 'text-purple-500',
      'go': 'text-cyan-500',
      'rs': 'text-orange-700',
      'php': 'text-indigo-600',
      'rb': 'text-red-700',
      'swift': 'text-orange-500',
      'kt': 'text-purple-700',
      'scala': 'text-red-500',
      'sql': 'text-blue-700',
      'xml': 'text-orange-500',
      'yaml': 'text-green-500',
      'yml': 'text-green-500',
      'toml': 'text-gray-600',
      'ini': 'text-gray-500',
      'conf': 'text-gray-500',
      'config': 'text-gray-500',
      'lock': 'text-red-500',
      'log': 'text-gray-500',
      'txt': 'text-gray-600',
      'gitignore': 'text-orange-600',
      'dockerfile': 'text-blue-500',
      'dockerignore': 'text-blue-400',
    };

    return iconMap[extension || ''] || 'text-gray-600';
  };

  const getFileName = (fileName: string) => {
    if (fileName === 'package.json') return 'Package';
    if (fileName === 'tsconfig.json') return 'TSConfig';
    if (fileName === 'next.config.js') return 'NextConfig';
    if (fileName === 'tailwind.config.js') return 'TailwindConfig';
    if (fileName === '.gitignore') return 'GitIgnore';
    if (fileName === 'README.md') return 'README';
    if (fileName === 'Dockerfile') return 'Docker';
    return fileName;
  };

  // Handle truncated folders
  if (node.truncated) {
    return (
      <div className="select-none">
        <div
          className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-200 cursor-pointer transition-colors`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400 italic">
            ... ({node.totalCount && node.children ? node.totalCount - node.children.length : 0} more files)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-200 cursor-pointer transition-colors ${
          node.type === 'file' ? 'ml-4' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={toggleExpand}
      >
        {node.type === 'folder' && (
          <div className="flex items-center gap-1">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <FolderIcon className="w-4 h-4 text-blue-500" />
            )}
          </div>
        )}
        
        {node.type === 'file' && (
          <File className={`w-4 h-4 ${getFileIcon(node.name)}`} />
        )}
        
        <span className={`text-sm ${
          node.type === 'folder' 
            ? 'font-medium text-slate-700' 
            : 'text-slate-600'
        }`}>
          {getFileName(node.name)}
        </span>
        
        {node.type === 'file' && (
          <span className="text-xs text-slate-400 ml-auto">
            {node.name.split('.').pop()?.toUpperCase()}
          </span>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNode key={child.path || index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({ data, level = 0 }) => {
  return (
    <div className="font-mono text-sm">
      {data.map((node, index) => (
        <TreeNode key={node.path || index} node={node} level={level} />
      ))}
    </div>
  );
};