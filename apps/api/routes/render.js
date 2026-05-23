import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { RenderPipeline } from '../services/renderPipeline.js';

export function createRenderRouter(root) {
  const router = Router();
  const pipeline = new RenderPipeline(root);

  router.post('/start', async (req, res) => {
    try {
      const { projectId, input, options } = req.body;

      let id = projectId;
      if (!id) {
        const project = await pipeline.createProject(input || {});
        id = project.id;
      } else if (input) {
        pipeline.mergeProjectInput(id, input);
      }

      const pipelineOptions = {
        ...(options || {}),
        ...(input ? { input } : {}),
        ...(input?.editMode ? { editMode: input.editMode } : {}),
        ...(input?.editMode === 'video-only' ? { videoOnly: true } : {}),
      };

      pipeline.cancelRender(id);

      res.json({ projectId: id, status: 'queued' });

      pipeline.runFullPipeline(id, pipelineOptions).catch((err) => {
        if (err?.name === 'RenderCancelledError') return;
        console.error('[Render]', err.message || err);
      });
    } catch (err) {
      console.error('[Render] start failed:', err.message || err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Render start failed' });
      }
    }
  });

  router.get('/status/:projectId', (req, res) => {
    const p = path.join(root, 'projects', req.params.projectId, 'project.json');
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'Not found' });
    res.json(JSON.parse(fs.readFileSync(p, 'utf8')));
  });

  router.post('/cancel/:projectId', (req, res) => {
    const cancelled = pipeline.cancelRender(req.params.projectId);
    res.json({ projectId: req.params.projectId, cancelled });
  });

  router.post('/restart', async (req, res) => {
    try {
      const { projectId, input, options } = req.body;

      let id = projectId;
      if (!id) {
        const project = await pipeline.createProject(input || {});
        id = project.id;
      } else {
        pipeline.cancelRender(id);
        if (input) pipeline.mergeProjectInput(id, input);
      }

      const pipelineOptions = {
        ...(options || {}),
        ...(input ? { input } : {}),
        ...(input?.editMode ? { editMode: input.editMode } : {}),
        ...(input?.editMode === 'video-only' ? { videoOnly: true } : {}),
      };

      res.json({ projectId: id, status: 'queued' });

      pipeline.runFullPipeline(id, pipelineOptions).catch((err) => {
        if (err?.name === 'RenderCancelledError') return;
        console.error('[Render]', err.message || err);
      });
    } catch (err) {
      console.error('[Render] restart failed:', err.message || err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Render restart failed' });
      }
    }
  });

  return router;
}
