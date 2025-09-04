import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  truncated?: boolean;
  totalCount?: number;
}

async function scanDirectory(dirPath: string, basePath: string = '', fileLimit: number = 20): Promise<FileNode[]> {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];
    const allItems: { name: string; path: string; type: 'file' | 'folder' }[] = [];

    // First pass: collect all items and filter
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const relativePath = basePath ? path.join(basePath, item.name) : item.name;
      
      // Skip hidden files and directories (starting with .)
      if (item.name.startsWith('.')) {
        continue;
      }

      // Skip node_modules directory
      if (item.name === 'node_modules') {
        continue;
      }

      // Skip .git directory
      if (item.name === '.git') {
        continue;
      }

      const itemType = item.isDirectory() ? 'folder' : 'file';
      allItems.push({
        name: item.name,
        path: relativePath,
        type: itemType
      });
    }

    // Sort items: folders first, then files, both alphabetically
    allItems.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });

    // Process items with file limit
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      const fullPath = path.join(dirPath, item.name);

      if (item.type === 'folder') {
        try {
          const children = await scanDirectory(fullPath, item.path, fileLimit);
          nodes.push({
            name: item.name,
            path: item.path,
            type: 'folder',
            children: children.length > 0 ? children : undefined
          });
        } catch (error) {
          // If we can't read a directory, just add it as an empty folder
          nodes.push({
            name: item.name,
            path: item.path,
            type: 'folder',
            children: undefined
          });
        }
      } else {
        nodes.push({
          name: item.name,
          path: item.path,
          type: 'file'
        });
      }

      // Check if we need to truncate at this level
      if (nodes.length >= fileLimit && i < allItems.length - 1) {
        // Remove the last item we added (it pushed us over the limit)
        nodes.pop();
        // Add a truncated indicator
        nodes.push({
          name: '...',
          path: `${basePath || ''}...`,
          type: 'folder',
          truncated: true,
          totalCount: allItems.length
        });
        break;
      }
    }

    return nodes;
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { path: requestedPath, fileLimit = 20 } = await request.json();
    
    if (!requestedPath) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // Validate file limit
    const limit = Math.max(1, Math.min(100, parseInt(fileLimit) || 20));

    // Resolve the path - handle both relative and absolute paths
    let targetPath: string;
    if (requestedPath.startsWith('.')) {
      // Relative path - resolve from current working directory
      targetPath = path.resolve(process.cwd(), requestedPath);
    } else if (path.isAbsolute(requestedPath)) {
      // Absolute path
      targetPath = requestedPath;
    } else {
      // Treat as relative path from current working directory
      targetPath = path.resolve(process.cwd(), requestedPath);
    }

    // Security check - ensure the path is within allowed boundaries  
    const resolvedPath = path.resolve(targetPath);
    const cwd = process.cwd();
    
    // For development, allow broader access on Windows and Unix-like systems
    // In production, you may want to restrict this further
    const isWindows = process.platform === 'win32';
    let isAllowed = false;
    
    if (isWindows) {
      // On Windows, allow access to any drive that exists
      const driveLetter = resolvedPath.charAt(0).toUpperCase();
      const validDrives = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
      isAllowed = validDrives.includes(driveLetter) && resolvedPath.includes(':\\');
    } else {
      // On Unix-like systems, allow common safe locations
      isAllowed = resolvedPath.startsWith(cwd) || 
                 resolvedPath.startsWith('/tmp') ||
                 resolvedPath.startsWith('/home') ||
                 resolvedPath.startsWith('/Users') ||
                 resolvedPath.startsWith('/var/tmp');
    }
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Access to this path is not allowed' },
        { status: 403 }
      );
    }

    // Check if the path exists and is a directory
    try {
      const stats = await fs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        return NextResponse.json(
          { error: 'Path must be a directory' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Directory not found' },
        { status: 404 }
      );
    }

    // Scan the directory
    const structure = await scanDirectory(resolvedPath, '', limit);

    return NextResponse.json({
      structure,
      path: resolvedPath,
      count: countNodes(structure),
      fileLimit: limit
    });

  } catch (error) {
    console.error('Error in folder-structure API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function countNodes(nodes: FileNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) {
      count += countNodes(node.children);
    }
  }
  return count;
}