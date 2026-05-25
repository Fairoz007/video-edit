import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { projectDir } from '../utils/paths.js';
import { hasPrepArtifacts } from '../utils/renderCheckpoint.js';
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
        console.error('[Render]', err.message || err, err.stack || '');
      });
    } catch (err) {
      console.error('[Render] start failed:', err.message || err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Render start failed' });
      }
    }
  });

  router.get('/status/:projectId', (req, res) => {
    const dir = projectDir(root, req.params.projectId);
    const p = path.join(dir, 'project.json');
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'Not found' });
    const project = JSON.parse(fs.readFileSync(p, 'utf8'));
    const videoOnly = project.input?.editMode === 'video-only';
    project.canResume =
      project.status !== 'completed' && hasPrepArtifacts(dir, videoOnly);
    project.resumeAvailable = project.canResume;
    res.json(project);
  });

  router.post('/cancel/:projectId', (req, res) => {
    const cancelled = pipeline.cancelRender(req.params.projectId);
    res.json({ projectId: req.params.projectId, cancelled });
  });

  router.post('/resume/:projectId', async (req, res) => {
    try {
      const id = req.params.projectId;
      const { input, options } = req.body || {};

      pipeline.cancelRender(id);
      if (input) pipeline.mergeProjectInput(id, input);

      const pipelineOptions = {
        ...(options || {}),
        ...(input ? { input } : {}),
        ...(input?.editMode ? { editMode: input.editMode } : {}),
        ...(input?.editMode === 'video-only' ? { videoOnly: true } : {}),
        resume: true,
      };

      res.json({ projectId: id, status: 'queued', resume: true });

      pipeline.runResumePipeline(id, pipelineOptions).catch((err) => {
        if (err?.name === 'RenderCancelledError') return;
        console.error('[Render] resume failed:', err.message || err);
      });
    } catch (err) {
      console.error('[Render] resume failed:', err.message || err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Resume failed' });
      }
    }
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
        console.error('[Render]', err.message || err, err.stack || '');
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
