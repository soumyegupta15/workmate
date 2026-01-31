'use strict';

const aiService = require('../services/aiService');
const workflowExecutor = require('../services/workflowExecutor');

async function handle(controllerFn, req, res) {
  try {
    const result = await controllerFn(req, res);
    if (!res.headersSent) {
      res.json(result);
    }
  } catch (err) {
    console.error(err);
    const status = err.statusCode || 400;
    res.status(status).json({
      error: err.message || 'Unexpected error'
    });
  }
}

function processAndExecute(req, res) {
  return handle(async () => {
    const { prompt, orgId, context } = req.body || {};
    
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      const error = new Error('Prompt is required');
      error.statusCode = 400;
      throw error;
    }

    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      const error = new Error('User authentication required');
      error.statusCode = 401;
      throw error;
    }

    console.log('[aiController] Processing prompt:', prompt);
    console.log('[aiController] Context:', context);
    
    // Process prompt with context to merge partial actions
    const action = await aiService.processPromptWithContext(prompt, context);
    console.log('[aiController] Parsed/merged action:', action);
    
    const enrichedReq = {
      ...req,
      orgId: orgId || req.orgId || null
    };

    console.log('[aiController] Executing action with userId:', req.user.id, 'orgId:', enrichedReq.orgId);
    
    try {
      const result = await workflowExecutor.executeAction(action, enrichedReq);
      console.log('[aiController] Action executed, result:', result);
      
      // Clear context on success
      return {
        data: {
          message: result.message || 'AI action executed successfully',
          action,
          result,
          success: true,
          context: null // Clear context on success
        }
      };
    } catch (error) {
      console.log('[aiController] Action execution error:', error.message, error.isQuestion);
      
      // If it's a question (missing field), return updated context
      if (error.isQuestion) {
        // Build updated context with partial action and missing fields
        // Extract all provided fields from the action
        const providedFields = {
          ...(action.data || {}),
          ...(action.filters || {}),
          ...(action.update || {})
        };
        
        // Remove null/undefined/empty values
        const cleanProvidedFields = {};
        for (const [key, value] of Object.entries(providedFields)) {
          if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value) && value.length > 0) {
              cleanProvidedFields[key] = value;
            } else if (!Array.isArray(value)) {
              cleanProvidedFields[key] = value;
            }
          }
        }
        
        const updatedContext = {
          partialAction: action,
          providedFields: cleanProvidedFields,
          missingFields: error.missingFields || [],
          actionType: action.action || null
        };
        
        console.log('[aiController] Updated context:', updatedContext);
        
        return {
          data: {
            message: error.message,
            action,
            result: null,
            success: false,
            isQuestion: true,
            missingFields: error.missingFields || [],
            context: updatedContext
          }
        };
      }
      
      // Otherwise, rethrow to be handled by the handle function
      throw error;
    }
  }, req, res);
}

module.exports = {
  processAndExecute
};
