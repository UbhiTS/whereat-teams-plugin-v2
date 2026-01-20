import axios from 'axios';
import { User } from '../types';

const API_BASE = '/api';

class ApiService {
  async getUsersWithLocation(): Promise<User[]> {
    try {
      const response = await axios.get(`${API_BASE}/users/with-location`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users with location:', error);
      return [];
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await axios.get(`${API_BASE}/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  async getUserByPrincipalName(principalName: string): Promise<User | null> {
    try {
      const response = await axios.get(`${API_BASE}/users/by-principal/${encodeURIComponent(principalName)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user by principal name:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await axios.get(`${API_BASE}/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user by id:', error);
      return null;
    }
  }

  async getDirectReports(userId: string): Promise<User[]> {
    try {
      const response = await axios.get(`${API_BASE}/users/${userId}/direct-reports`);
      return response.data;
    } catch (error) {
      console.error('Error fetching direct reports:', error);
      return [];
    }
  }

  // Get direct reports with full details (non-recursive, for lazy loading)
  async getDirectReportsDetails(userId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE}/users/${userId}/direct-reports-details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching direct reports details:', error);
      return [];
    }
  }

  async getManagementChain(principalName: string): Promise<User[]> {
    try {
      const response = await axios.get(`${API_BASE}/users/management-chain/${encodeURIComponent(principalName)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching management chain:', error);
      return [];
    }
  }

  async getOrgTree(principalName: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE}/users/org-tree/${encodeURIComponent(principalName)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching org tree:', error);
      return null;
    }
  }

  async getDirectReportsTree(userId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE}/users/${userId}/direct-reports-tree`);
      return response.data;
    } catch (error) {
      console.error('Error fetching direct reports tree:', error);
      return [];
    }
  }

  async searchUsers(term: string): Promise<User[]> {
    try {
      const response = await axios.get(`${API_BASE}/users/search/${encodeURIComponent(term)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  async getLocationStats(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE}/users/stats/locations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching location stats:', error);
      return null;
    }
  }

  async sendChatMessage(message: string, userPrincipalName?: string): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE}/search/chat`, {
        message,
        userPrincipalName
      });
      return response.data.response;
    } catch (error) {
      console.error('Error sending chat message:', error);
      return 'Sorry, I encountered an error processing your request. Please try again.';
    }
  }
}

export const apiService = new ApiService();
