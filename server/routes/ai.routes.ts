import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { processOpsCommand } from '../services/ai-agent.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/ai/conversations
router.get('/conversations', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const conversations = db.getAiConversations(req.user!.id);
  return res.json({ conversations });
});

// GET /api/ai/conversations/:id/messages
router.get('/conversations/:id/messages', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const messages = db.getAiMessages(req.params.id);
  return res.json({ messages });
});

// POST /api/ai/chat
router.post('/chat', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { message, conversationId } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  let activeConvId = conversationId;
  if (!activeConvId) {
    const title = message.slice(0, 30) + (message.length > 30 ? '...' : '');
    const conv = db.createAiConversation(req.user!.id, title);
    activeConvId = conv.id;
  }

  // Record user message
  db.addAiMessage({
    conversationId: activeConvId,
    role: 'user',
    content: message,
  });

  try {
    const { reply, toolCallsExecuted } = await processOpsCommand(message, req.user!.id);

    // Record AI assistant response
    const aiMsg = db.addAiMessage({
      conversationId: activeConvId,
      role: 'assistant',
      content: reply,
      toolCalls: toolCallsExecuted.length > 0 ? JSON.stringify(toolCallsExecuted.map(t => ({ tool: t.tool, args: t.args }))) : undefined,
      toolResults: toolCallsExecuted.length > 0 ? JSON.stringify(toolCallsExecuted.map(t => t.result)) : undefined,
    });

    return res.json({
      conversationId: activeConvId,
      message: aiMsg,
      toolCalls: toolCallsExecuted,
    });
  } catch (err: any) {
    console.error('Error processing AI command:', err);
    const fallbackMsg = db.addAiMessage({
      conversationId: activeConvId,
      role: 'assistant',
      content: `I encountered an unexpected error processing your command: ${err?.message || 'Internal failure'}. Please retry or check the parameters.`,
    });
    return res.status(500).json({ conversationId: activeConvId, message: fallbackMsg, error: err?.message });
  }
});

export default router;
