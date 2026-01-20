import React, { useState, useEffect, useCallback } from 'react';
import { app, authentication } from '@microsoft/teams-js';
import MapView from './components/MapView';
import ManagementChain from './components/ManagementChain';
import ChatPanel from './components/ChatPanel';
import Header from './components/Header';
import { User, UserContext } from './types';
import { apiService } from './services/api';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [visibleUsers, setVisibleUsers] = useState<User[]>([]);
  const [managementChain, setManagementChain] = useState<User[]>([]);
  const [directReports, setDirectReports] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [shouldZoomToUser, setShouldZoomToUser] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isManagementChainOpen, setIsManagementChainOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [managementChainWidth, setManagementChainWidth] = useState(320);
  const [isTeamsContext, setIsTeamsContext] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Check for user parameter in URL (for testing outside Teams)
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    
    if (userParam) {
      // Use URL parameter for testing
      console.log('Using user from URL parameter:', userParam);
      await loadUserData(userParam);
      return;
    }

    try {
      // Try to initialize Teams SDK
      await app.initialize();
      setIsTeamsContext(true);
      
      const context = await app.getContext();
      const userPrincipalName = context.user?.userPrincipalName;
      
      if (userPrincipalName) {
        await loadUserData(userPrincipalName);
      }
    } catch (error) {
      console.log('Not running in Teams context, using demo mode');
      setIsTeamsContext(false);
      // Try to load a default user - you can change this to your email
      const defaultUser = 'tubhi@microsoft.com';
      const user = await apiService.getUserByPrincipalName(defaultUser);
      if (user) {
        await loadUserData(defaultUser);
      } else {
        await loadDemoData();
      }
    }
  };

  const loadUserData = async (userPrincipalName: string) => {
    setIsLoading(true);
    try {
      // Load current user
      const user = await apiService.getUserByPrincipalName(userPrincipalName);
      setCurrentUser(user);

      // Load all users for map
      const users = await apiService.getUsersWithLocation();
      setAllUsers(users);

      // Load management chain
      const chain = await apiService.getManagementChain(userPrincipalName);
      setManagementChain(chain);

      // Load direct reports
      if (user?.id) {
        const reports = await apiService.getDirectReports(user.id);
        setDirectReports(reports);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoData = async () => {
    setIsLoading(true);
    try {
      // Load all users for map
      const users = await apiService.getUsersWithLocation();
      setAllUsers(users);

      // Use first user as demo current user
      if (users.length > 0) {
        const demoUser = users[0];
        setCurrentUser(demoUser);
        
        // Load management chain for demo user
        const chain = await apiService.getManagementChain(demoUser.userPrincipalName);
        setManagementChain(chain);

        // Load direct reports
        const reports = await apiService.getDirectReports(demoUser.id);
        setDirectReports(reports);
      }
    } catch (error) {
      console.error('Error loading demo data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = useCallback((user: User, shouldZoom: boolean = false) => {
    setSelectedUser(user);
    setShouldZoomToUser(shouldZoom);
  }, []);

  const handleVisibleUsersChange = useCallback((users: User[]) => {
    setVisibleUsers(users);
  }, []);

  const userContext: UserContext = {
    currentUser,
    allUsers,
    managementChain,
    directReports,
    selectedUser
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Where@ - Team Insights...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header currentUser={currentUser} />
      
      <div className="main-content">
        <div className="map-container">
          <MapView 
            users={visibleUsers}
            currentUser={currentUser}
            managementChain={managementChain}
            directReports={directReports}
            selectedUser={selectedUser}
            shouldZoomToUser={shouldZoomToUser}
            onUserSelect={handleUserSelect}
          />
        </div>

        {isManagementChainOpen && (
          <ManagementChain 
            currentUser={currentUser}
            managementChain={managementChain}
            onClose={() => setIsManagementChainOpen(false)}
            onUserSelect={handleUserSelect}
            onVisibleUsersChange={handleVisibleUsersChange}
            panelWidth={managementChainWidth}
            onPanelWidthChange={setManagementChainWidth}
          />
        )}
      </div>

      <ChatPanel 
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        currentUser={currentUser}
        managementChainWidth={isManagementChainOpen ? managementChainWidth : 0}
      />

      {!isManagementChainOpen && (
        <button 
          className="management-chain-toggle"
          onClick={() => setIsManagementChainOpen(true)}
          title="Show Management Chain"
        >
          👥
        </button>
      )}
    </div>
  );
};

export default App;
