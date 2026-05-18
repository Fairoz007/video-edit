import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { projectDir } from '../utils/paths.js';

function cleanWorkspaceDir(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let removed = 0;
  for (const name of fs.readdirSync(dirPath)) {
    if (name === '.gitkeep') continue;
    fs.rmSync(path.join(dirPath, name), { recursive: true, force: true });
    removed++;
  }
  return removed;
}

export function createProjectRouter(root) {
  const router = Router();

  /** Remove all projects, cache, exports, and out artifacts (keeps .gitkeep). */
  router.delete('/workspace', (_req, res) => {
    try {
      const counts = {
        projects: cleanWorkspaceDir(path.join(root, 'projects')),
        cache: cleanWorkspaceDir(path.join(root, 'cache')),
        exports: cleanWorkspaceDir(path.join(root, 'exports')),
        out: cleanWorkspaceDir(path.join(root, 'out')),
      };
      res.json({ ok: true, removed: counts });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/', (_req, res) => {
    const projectsPath = path.join(root, 'projects');
    if (!fs.existsSync(projectsPath)) return res.json([]);
    const ids = fs.readdirSync(projectsPath).filter((f) => {
      return fs.statSync(path.join(projectsPath, f)).isDirectory();
    });
    const projects = ids.map((id) => {
      const p = path.join(projectsPath, id, 'project.json');
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      return { id, status: 'unknown' };
    });
    res.json(projects);
  });

  router.get('/:id', (req, res) => {
    const p = path.join(root, 'projects', req.params.id, 'project.json');
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'Project not found' });
    res.json(JSON.parse(fs.readFileSync(p, 'utf8')));
  });

  router.post('/', (req, res) => {
    const { input } = req.body;
    const id = `proj-${Date.now()}`;
    const dir = projectDir(root, id);
    const project = { id, input, status: 'draft', createdAt: new Date().toISOString() };
    fs.writeFileSync(path.join(dir, 'project.json'), JSON.stringify(project, null, 2));
    res.json(project);
  });

  router.put('/:id', (req, res) => {
    const p = path.join(root, 'projects', req.params.id, 'project.json');
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'Not found' });
    const existing = JSON.parse(fs.readFileSync(p, 'utf8'));
    const updated = { ...existing, ...req.body, id: req.params.id };
    fs.writeFileSync(p, JSON.stringify(updated, null, 2));
    res.json(updated);
  });

  return router;
}
