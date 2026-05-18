/**
 * Simple in-memory render queue for background processing.
 */
import { Router } from 'express';
import { RenderPipeline } from '../services/renderPipeline.js';

const queue = [];
let processing = false;

async function processQueue(root) {
  if (processing || queue.length === 0) return;
  processing = true;
  const pipeline = new RenderPipeline(root);

  while (queue.length > 0) {
    const job = queue.shift();
    job.status = 'processing';
    try {
      let projectId = job.projectId;
      if (!projectId) {
        const p = await pipeline.createProject(job.input || {});
        projectId = p.id;
      } else if (job.input) {
        pipeline.mergeProjectInput(projectId, job.input);
      }
      job.projectId = projectId;
      const pipelineOptions = {
        ...(job.options || {}),
        ...(job.input ? { input: job.input } : {}),
        ...(job.input?.editMode ? { editMode: job.input.editMode } : {}),
        ...(job.input?.editMode === 'video-only' ? { videoOnly: true } : {}),
      };
      await pipeline.runFullPipeline(projectId, pipelineOptions, (progress) => {
        job.progress = progress;
      });
      job.status = 'completed';
    } catch (err) {
      job.status = 'failed';
      job.error = err.message;
    }
  }

  processing = false;
}

export function createQueueRouter(root) {
  const router = Router();

  router.get('/', (_req, res) => res.json(queue));

  router.post('/add', (req, res) => {
    const job = {
      id: `job-${Date.now()}`,
      ...req.body,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    queue.push(job);
    processQueue(root);
    res.json(job);
  });

  router.delete('/:id', (req, res) => {
    const idx = queue.findIndex((j) => j.id === req.params.id);
    if (idx >= 0) queue.splice(idx, 1);
    res.json({ ok: true });
  });

  return router;
}
