import { Router, Request, Response } from 'express';
import { chatService } from '../services/chatService';
import { searchService } from '../services/searchService';

export const searchRouter = Router();

// Chat endpoint
searchRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, userPrincipalName } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatService.processMessage(message, userPrincipalName);
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Search endpoint
searchRouter.get('/query', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const results = await searchService.search(q);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});
