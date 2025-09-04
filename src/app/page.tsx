'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderOpen, Upload, FileText, Folder, Copy, Download } from 'lucide-react';
import { FolderTree } from '@/components/folder-tree';
import { useToast } from '@/hooks/use-toast';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  truncated?: boolean;
  totalCount?: number;
}

export default function Home() {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [folderStructure, setFolderStructure] = useState<FileNode[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileLimit, setFileLimit] = useState<number>(20);
  const { toast } = useToast();

  const handleFolderSelect = async (path?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/folder-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          path: path || selectedPath || '.',
          fileLimit 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFolderStructure(data.structure);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to fetch folder structure",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualPathInput = () => {
    if (!selectedPath.trim()) {
      toast({
        title: "Error",
        description: "Please enter a folder path",
        variant: "destructive",
      });
      return;
    }
    handleFolderSelect(selectedPath);
  };

  const generateTextStructure = (nodes: FileNode[], indent = 0): string => {
    let result = '';
    const indentStr = '  '.repeat(indent);
    
    for (const node of nodes) {
      if (node.type === 'folder') {
        result += `${indentStr}📁 ${node.name}\n`;
        if (node.children && node.children.length > 0) {
          result += generateTextStructure(node.children, indent + 1);
        }
        if (node.truncated && node.totalCount) {
          result += `${indentStr}  ... (${node.totalCount - (node.children?.length || 0)} more files)\n`;
        }
      } else {
        result += `${indentStr}📄 ${node.name}\n`;
      }
    }
    
    return result;
  };

  const generateMarkdownStructure = (nodes: FileNode[], indent = 0): string => {
    let result = '';
    const indentStr = '  '.repeat(indent);
    
    for (const node of nodes) {
      if (node.type === 'folder') {
        result += `${indentStr}- 📁 **${node.name}**\n`;
        if (node.children && node.children.length > 0) {
          result += generateMarkdownStructure(node.children, indent + 1);
        }
        if (node.truncated && node.totalCount) {
          result += `${indentStr}  - *... (${node.totalCount - (node.children?.length || 0)} more files)*\n`;
        }
      } else {
        result += `${indentStr}- 📄 ${node.name}\n`;
      }
    }
    
    return result;
  };

  const copyToClipboard = async (format: 'text' | 'markdown') => {
    if (!folderStructure) {
      toast({
        title: "Error",
        description: "No folder structure to copy",
        variant: "destructive",
      });
      return;
    }
    
    const content = format === 'text' 
      ? generateTextStructure(folderStructure)
      : generateMarkdownStructure(folderStructure);
    
    console.log('Generated content:', content); // Debug log
    
    if (!content || content.trim() === '') {
      toast({
        title: "Error",
        description: "Generated content is empty",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
        console.log('Copied using modern clipboard API');
        toast({
          title: "Success!",
          description: `Folder structure copied as ${format.toUpperCase()}`,
        });
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          console.log('Copied using fallback method');
          toast({
            title: "Success!",
            description: `Folder structure copied as ${format.toUpperCase()}`,
          });
        } else {
          throw new Error('Failed to copy using fallback method');
        }
      }
    } catch (error) {
      console.error('Copy failed:', error);
      
      // Fallback: Show content in an alert for manual copying
      const truncatedContent = content.length > 1000 ? content.substring(0, 1000) + '...\n\n(Content truncated. Check browser console for full content.)' : content;
      
      alert(`Copy failed. Please manually copy the content below:\n\n${truncatedContent}`);
      
      // Also log the full content to console
      console.log('Folder structure content to copy manually:');
      console.log('=====================================');
      console.log(content);
      console.log('=====================================');
      
      toast({
        title: "Copy Failed",
        description: "Content displayed in popup and console for manual copying.",
        variant: "destructive",
      });
    }
  };

  const downloadStructure = (format: 'text' | 'markdown') => {
    if (!folderStructure) {
      toast({
        title: "Error",
        description: "No folder structure to download",
        variant: "destructive",
      });
      return;
    }
    
    const content = format === 'text' 
      ? generateTextStructure(folderStructure)
      : generateMarkdownStructure(folderStructure);
    
    console.log('Generated content for download:', content); // Debug log
    
    if (!content || content.trim() === '') {
      toast({
        title: "Error",
        description: "Generated content is empty",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const mimeType = format === 'markdown' ? 'text/markdown' : 'text/plain';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `folder-structure.${format === 'markdown' ? 'md' : 'txt'}`;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Download initiated successfully');
      
      toast({
        title: "Success!",
        description: `Folder structure downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Folder Structure Generator
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Generate beautiful, interactive folder structure trees from any directory. 
            Perfect for documentation, project visualization, and code analysis.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {/* Folder Selection Card */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-6 h-6" />
                Select Folder
              </CardTitle>
              <CardDescription>
                Enter the full path to a folder on your computer to generate its structure tree
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="folder-path">Folder Path</Label>
                  <Input
                    id="folder-path"
                    placeholder="Enter folder path (e.g., C:\Users\Username\Documents or /home/username/projects)"
                    value={selectedPath}
                    onChange={(e) => setSelectedPath(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button 
                  onClick={() => handleFolderSelect()} 
                  disabled={isLoading}
                  className="px-6"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Generate Tree
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="file-limit">File Limit:</Label>
                  <Input
                    id="file-limit"
                    type="number"
                    min="1"
                    max="100"
                    value={fileLimit}
                    onChange={(e) => setFileLimit(Math.max(1, Math.min(100, parseInt(e.target.value) || 20)))}
                    className="w-20"
                  />
                  <span className="text-sm text-slate-500">files per folder</span>
                </div>
              </div>
              
              {/* Common Path Shortcuts */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600 mb-2">Quick paths:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPath('.');
                      handleFolderSelect('.');
                    }}
                  >
                    Current Directory (.)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPath('C:\\Users')}
                  >
                    C:\Users (Windows)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPath('/home')}
                  >
                    /home (Linux/Mac)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPath('C:\\Projects')}
                  >
                    C:\Projects
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Folder Tree Display */}
          {folderStructure && (
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-6 h-6" />
                      Folder Structure
                    </CardTitle>
                    <CardDescription>
                      Interactive tree view of your folder structure
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard('text')}
                      className="flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Text
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard('markdown')}
                      className="flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Markdown
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadStructure('text')}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download TXT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadStructure('markdown')}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download MD
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 rounded-lg p-4 border max-h-96 overflow-y-auto">
                  <FolderTree data={folderStructure} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}