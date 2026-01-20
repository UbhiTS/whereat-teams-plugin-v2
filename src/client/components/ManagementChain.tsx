import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../types';
import { 
  Avatar, 
  Text,
  Button,
  Spinner
} from '@fluentui/react-components';
import { 
  DismissRegular,
  ChevronRightRegular,
  ChevronDownRegular
} from '@fluentui/react-icons';
import { apiService } from '../services/api';

interface TreeNode {
  user: User & { hasDirectReports?: boolean; directReportsData?: any[]; directReportCount?: number };
  type: 'ceo' | 'manager' | 'current' | 'direct-report' | 'peer';
  level: number;
  children?: TreeNode[];
}

interface ManagementChainProps {
  currentUser: User | null;
  managementChain: User[];
  onClose: () => void;
  onUserSelect: (user: User, shouldZoom: boolean) => void;
  onVisibleUsersChange: (users: User[]) => void;
  panelWidth?: number;
  onPanelWidthChange?: (width: number) => void;
}

const MIN_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 600;
const DEFAULT_PANEL_WIDTH = 320;

interface TreeNodeProps {
  node: TreeNode;
  onUserSelect: (user: User, shouldZoom: boolean) => void;
  currentUserId: string | null;
  defaultExpanded?: boolean;
  onExpandChange?: (nodeId: string, isExpanded: boolean, children: User[]) => void;
}

const TreeNodeComponent: React.FC<TreeNodeProps> = ({ 
  node, 
  onUserSelect, 
  currentUserId,
  defaultExpanded = false,
  onExpandChange
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [children, setChildren] = useState<TreeNode[]>(node.children || []);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(!!node.children);

  const hasChildren = node.user.hasDirectReports || 
    (node.user.directReportsData && node.user.directReportsData.length > 0) ||
    (node.children && node.children.length > 0) ||
    (node.user.directReportCount && node.user.directReportCount > 0) ||
    (node.user.directReportIds && node.user.directReportIds.length > 0);

  const loadChildren = async () => {
    if (hasLoaded || isLoading) return [];
    
    setIsLoading(true);
    try {
      // Use the new non-recursive endpoint that only fetches immediate direct reports
      const reports = await apiService.getDirectReportsDetails(node.user.id);
      // Reports are already sorted by the server
      const childNodes: TreeNode[] = reports.map(report => ({
        user: report,
        type: report.id === currentUserId ? 'current' : 'direct-report',
        level: node.level + 1
        // No children property - they will be loaded on demand when this node is expanded
      }));
      setChildren(childNodes);
      setHasLoaded(true);
      return childNodes;
    } catch (error) {
      console.error('Error loading children:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const willExpand = !isExpanded;
    let currentChildren = children;
    
    if (willExpand && !hasLoaded) {
      const loadedChildren = await loadChildren();
      currentChildren = loadedChildren;
    }
    
    setIsExpanded(willExpand);
    
    if (onExpandChange) {
      const childUsers = currentChildren.map(c => c.user);
      onExpandChange(node.user.id, willExpand, childUsers);
    }
  };

  const handleRowClick = async () => {
    onUserSelect(node.user, false); // Single click - center only, no zoom
    // Also toggle expand/collapse if there are children
    if (hasChildren) {
      const willExpand = !isExpanded;
      let currentChildren = children;
      
      if (willExpand && !hasLoaded) {
        const loadedChildren = await loadChildren();
        currentChildren = loadedChildren;
      }
      
      setIsExpanded(willExpand);
      
      if (onExpandChange) {
        const childUsers = currentChildren.map(c => c.user);
        onExpandChange(node.user.id, willExpand, childUsers);
      }
    }
  };

  const getBorderColor = () => {
    switch (node.type) {
      case 'ceo': return '#FF9500';
      case 'manager': return '#FF9500';
      case 'current': return '#5B5FC7';
      case 'direct-report': return '#34C759';
      case 'peer': return '#60A5FA'; // Blue for peers
      default: return '#ffffff';
    }
  };

  const getRoleLabel = () => {
    const title = node.user.jobTitle || '';
    if (title.toLowerCase().includes('ceo')) return 'CEO';
    if (title.toLowerCase().includes('svp')) return 'SVP';
    if (title.toLowerCase().includes('vp') && !title.toLowerCase().includes('svp')) return 'VP';
    if (title.toLowerCase().includes('director')) return 'Director';
    if (title.toLowerCase().includes('manager')) return 'Manager';
    return '';
  };

  const getChildCount = () => {
    return node.user.directReportCount ||
           node.user.directReportIds?.length || 
           node.user.directReportsData?.length || 
           node.children?.length || 
           0;
  };

  const handleDoubleClick = () => {
    onUserSelect(node.user, true); // Double click - zoom in
  };

  return (
    <div className="tree-node-container">
      <div 
        className={`tree-node ${node.type} ${isExpanded ? 'expanded' : ''}`}
        onClick={handleRowClick}
        onDoubleClick={handleDoubleClick}
        style={{ paddingLeft: `${12 + node.level * 24}px` }}
      >
        <div className="tree-toggle" onClick={handleToggle}>
          {hasChildren ? (
            isLoading ? (
              <Spinner size="tiny" />
            ) : isExpanded ? (
              <ChevronDownRegular fontSize={16} />
            ) : (
              <ChevronRightRegular fontSize={16} />
            )
          ) : (
            <span className="tree-spacer" />
          )}
        </div>
        
        <div 
          className="tree-avatar-wrapper"
          style={{ border: `3px solid ${getBorderColor()}`, borderRadius: '50%' }}
        >
          <Avatar
            image={{ src: node.user.photo }}
            name={node.user.displayName}
            size={32}
          />
        </div>
        
        <div className="tree-info">
          <div className="tree-name">
            {node.type === 'current' ? 'You' : node.user.displayName}
            {getRoleLabel() && <span className="role-badge">{getRoleLabel()}</span>}
          </div>
          <div className="tree-title">{node.user.jobTitle || 'Unknown'}</div>
          {node.user.location && (node.user.location.city || node.user.location.state) && (
            <div className="tree-location">
              {[node.user.location.city, node.user.location.state].filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        {hasChildren && (
          <span className="tree-count" title={`${getChildCount()} direct reports`}>
            {getChildCount()}
          </span>
        )}
      </div>

      {isExpanded && children.length > 0 && (
        <div className="tree-children">
          {children.map(child => (
            <TreeNodeComponent
              key={child.user.id}
              node={child}
              onUserSelect={onUserSelect}
              currentUserId={currentUserId}
              defaultExpanded={child.type === 'current'}
              onExpandChange={onExpandChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ManagementChain: React.FC<ManagementChainProps> = ({
  currentUser,
  managementChain,
  onClose,
  onUserSelect,
  onVisibleUsersChange,
  panelWidth: externalPanelWidth,
  onPanelWidthChange
}) => {
  const [orgTree, setOrgTree] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Map<string, User[]>>(new Map());
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [internalPanelWidth, setInternalPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Use external width if provided, otherwise use internal state
  const panelWidth = externalPanelWidth ?? internalPanelWidth;
  const setPanelWidth = (width: number) => {
    if (onPanelWidthChange) {
      onPanelWidthChange(width);
    } else {
      setInternalPanelWidth(width);
    }
  };

  // Handle resize mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate new width based on mouse position from right edge
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, newWidth));
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  useEffect(() => {
    loadOrgTree();
  }, [currentUser, managementChain]);

  // Collect all visible users when tree or expansions change
  const collectVisibleUsers = useCallback((nodes: TreeNode[], expanded: Map<string, User[]>, collapsed: Set<string>): User[] => {
    const users: User[] = [];
    const addedUserIds = new Set<string>(); // Track added users to avoid duplicates
    
    // Recursive function to add a user and their dynamic children
    const addUserWithDynamicChildren = (user: User) => {
      if (addedUserIds.has(user.id)) return;
      
      addedUserIds.add(user.id);
      users.push(user);
      
      // Check if this user has dynamically loaded children that are expanded
      if (!collapsed.has(user.id)) {
        const dynamicChildren = expanded.get(user.id);
        if (dynamicChildren) {
          dynamicChildren.forEach(childUser => addUserWithDynamicChildren(childUser));
        }
      }
    };
    
    const traverse = (node: TreeNode, parentExpanded: boolean = true) => {
      if (parentExpanded) {
        addUserWithDynamicChildren(node.user);
        
        // Check if this node is explicitly collapsed
        const isCollapsed = collapsed.has(node.user.id);
        
        // If this node has pre-loaded children
        if (node.children && node.children.length > 0 && !isCollapsed) {
          // Level 0 nodes are expanded by default unless explicitly collapsed
          const isExpanded = node.level === 0 || expanded.has(node.user.id);
          if (isExpanded) {
            node.children.forEach(child => traverse(child, true));
          }
        }
      }
    };
    
    nodes.forEach(node => traverse(node, true));
    return users;
  }, []);

  // Update visible users when tree or expansions change
  useEffect(() => {
    if (orgTree.length > 0) {
      const visibleUsers = collectVisibleUsers(orgTree, expandedNodes, collapsedNodes);
      onVisibleUsersChange(visibleUsers);
    }
  }, [orgTree, expandedNodes, collapsedNodes, collectVisibleUsers, onVisibleUsersChange]);

  const handleExpandChange = useCallback((nodeId: string, isExpanded: boolean, children: User[]) => {
    setExpandedNodes(prev => {
      const next = new Map(prev);
      if (isExpanded && children.length > 0) {
        next.set(nodeId, children);
      } else {
        next.delete(nodeId);
      }
      return next;
    });
    
    // Track collapsed state separately
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (isExpanded) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const loadOrgTree = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const treeData = await apiService.getOrgTree(currentUser.userPrincipalName);
      
      if (treeData) {
        const tree: TreeNode[] = [];
        
        // Build tree from management chain (reversed to show CEO first)
        const chainReversed = [...(treeData.managementChain || [])].reverse();
        
        // Get peers and sort alphabetically
        const peers = [...(treeData.peers || [])].sort((a: any, b: any) => 
          (a.displayName || '').localeCompare(b.displayName || '')
        );
        
        chainReversed.forEach((manager, index) => {
          const isDirectManager = index === chainReversed.length - 1;
          
          // For the direct manager, show all peers (including current user)
          let children: TreeNode[] | undefined = undefined;
          
          if (isDirectManager) {
            // Use peers which includes all siblings sorted alphabetically
            children = peers.map((peer: any) => {
              const isCurrentUser = peer.id === currentUser.id || peer.isCurrentUser;
              const directReports = isCurrentUser && treeData.currentUser?.directReportsData
                ? [...treeData.currentUser.directReportsData].sort((a: any, b: any) =>
                    (a.displayName || '').localeCompare(b.displayName || '')
                  )
                : undefined;
              return {
                user: isCurrentUser ? treeData.currentUser : peer,
                type: isCurrentUser ? 'current' : 'peer',
                level: 1,
                children: directReports?.map((dr: any) => ({
                  user: dr,
                  type: 'direct-report' as const,
                  level: 2
                }))
              };
            });
          }
          
          tree.push({
            user: manager,
            type: index === 0 ? 'ceo' : 'manager',
            level: 0,
            children
          });
        });

        // If no management chain, just show current user at root
        if (tree.length === 0 && treeData.currentUser) {
          const sortedDirectReports = treeData.currentUser.directReportsData
            ? [...treeData.currentUser.directReportsData].sort((a: any, b: any) =>
                (a.displayName || '').localeCompare(b.displayName || '')
              )
            : undefined;
          tree.push({
            user: treeData.currentUser,
            type: 'current',
            level: 0,
            children: sortedDirectReports?.map((dr: any) => ({
              user: dr,
              type: 'direct-report',
              level: 1
            }))
          });
        }

        setOrgTree(tree);
      }
    } catch (error) {
      console.error('Error loading org tree:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="management-chain-panel" style={{ width: panelWidth }}>
      <div 
        ref={resizeRef}
        className={`panel-resize-handle ${isResizing ? 'resizing' : ''}`}
        onMouseDown={handleMouseDown}
      />
      <div className="panel-header">
        <Text size={400} weight="semibold">Management Chain</Text>
        <Button
          appearance="subtle"
          icon={<DismissRegular />}
          onClick={onClose}
          title="Close"
        />
      </div>

      <div className="tree-container">
        {isLoading ? (
          <div className="tree-loading">
            <Spinner size="medium" />
            <Text size={200}>Loading organization...</Text>
          </div>
        ) : orgTree.length === 0 ? (
          <div className="tree-empty">
            <Text>No organization data available</Text>
          </div>
        ) : (
          orgTree.map((node) => (
            <TreeNodeComponent
              key={node.user.id}
              node={node}
              onUserSelect={onUserSelect}
              currentUserId={currentUser?.id || null}
              defaultExpanded={!!(node.children && node.children.length > 0)}
              onExpandChange={handleExpandChange}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ManagementChain;
