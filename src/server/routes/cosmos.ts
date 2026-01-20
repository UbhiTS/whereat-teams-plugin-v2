import { Router, Request, Response } from 'express';
import { cosmosService } from '../services/cosmosService';

export const cosmosRouter = Router();

// Test connection
cosmosRouter.get('/test', async (req: Request, res: Response) => {
  try {
    const users = await cosmosService.getAllUsers();
    res.json({ 
      success: true, 
      message: 'CosmosDB connection successful',
      userCount: users.length 
    });
  } catch (error) {
    console.error('CosmosDB test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'CosmosDB connection failed' 
    });
  }
});
