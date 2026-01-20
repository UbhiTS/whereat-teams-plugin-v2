import { Router, Request, Response } from 'express';
import { cosmosService } from '../services/cosmosService';

export const usersRouter = Router();

// Get all users
usersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const users = await cosmosService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get users with location data for map
usersRouter.get('/with-location', async (req: Request, res: Response) => {
  try {
    const users = await cosmosService.getUsersWithLocation();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users with location:', error);
    res.status(500).json({ error: 'Failed to fetch users with location' });
  }
});

// Get user by principal name
usersRouter.get('/by-principal/:principalName', async (req: Request, res: Response) => {
  try {
    const { principalName } = req.params;
    const user = await cosmosService.getUserByPrincipalName(principalName);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user photo by principal name
usersRouter.get('/photo/:principalName', async (req: Request, res: Response) => {
  try {
    const { principalName } = req.params;
    const photo = await cosmosService.getUserPhoto(decodeURIComponent(principalName));
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json({ photo });
  } catch (error) {
    console.error('Error fetching user photo:', error);
    res.status(500).json({ error: 'Failed to fetch user photo' });
  }
});

// Get multiple user photos
usersRouter.post('/photos', async (req: Request, res: Response) => {
  try {
    const { userPrincipalNames } = req.body;
    if (!Array.isArray(userPrincipalNames)) {
      return res.status(400).json({ error: 'userPrincipalNames must be an array' });
    }
    const photos = await cosmosService.getUserPhotos(userPrincipalNames);
    res.json(photos);
  } catch (error) {
    console.error('Error fetching user photos:', error);
    res.status(500).json({ error: 'Failed to fetch user photos' });
  }
});

// Get user by ID
usersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await cosmosService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get direct reports for a user (basic info)
usersRouter.get('/:id/direct-reports', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const directReports = await cosmosService.getDirectReports(id);
    res.json(directReports);
  } catch (error) {
    console.error('Error fetching direct reports:', error);
    res.status(500).json({ error: 'Failed to fetch direct reports' });
  }
});

// Get direct reports with full details (non-recursive, includes hasDirectReports flag)
usersRouter.get('/:id/direct-reports-details', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const directReports = await cosmosService.getDirectReportsWithDetails(id);
    res.json(directReports);
  } catch (error) {
    console.error('Error fetching direct reports details:', error);
    res.status(500).json({ error: 'Failed to fetch direct reports details' });
  }
});

// Get management chain for a user
usersRouter.get('/management-chain/:principalName', async (req: Request, res: Response) => {
  try {
    const { principalName } = req.params;
    const chain = await cosmosService.getManagementChain(decodeURIComponent(principalName));
    res.json(chain);
  } catch (error) {
    console.error('Error fetching management chain:', error);
    res.status(500).json({ error: 'Failed to fetch management chain' });
  }
});

// Get full org tree for a user
usersRouter.get('/org-tree/:principalName', async (req: Request, res: Response) => {
  try {
    const { principalName } = req.params;
    const tree = await cosmosService.getOrgTree(decodeURIComponent(principalName));
    res.json(tree);
  } catch (error) {
    console.error('Error fetching org tree:', error);
    res.status(500).json({ error: 'Failed to fetch org tree' });
  }
});

// Get recursive direct reports for a user
usersRouter.get('/:id/direct-reports-tree', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reports = await cosmosService.getDirectReportsRecursive(id);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching direct reports tree:', error);
    res.status(500).json({ error: 'Failed to fetch direct reports tree' });
  }
});

// Search users
usersRouter.get('/search/:term', async (req: Request, res: Response) => {
  try {
    const { term } = req.params;
    const users = await cosmosService.searchUsers(decodeURIComponent(term));
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get users by location
usersRouter.get('/location/filter', async (req: Request, res: Response) => {
  try {
    const { city, country } = req.query;
    const users = await cosmosService.getUsersByLocation(
      city as string | undefined,
      country as string | undefined
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users by location:', error);
    res.status(500).json({ error: 'Failed to fetch users by location' });
  }
});

// Get location statistics
usersRouter.get('/stats/locations', async (req: Request, res: Response) => {
  try {
    const stats = await cosmosService.getLocationStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching location stats:', error);
    res.status(500).json({ error: 'Failed to fetch location statistics' });
  }
});
