import { Router } from 'express';
import fs from 'fs';
import path from 'path';

export function createExportsRouter(root) {
  const router = Router();
  const exportsDir = path.join(root, 'exports');

  /** Stream export MP4 with Range support (required for in-app video preview). */
  router.get('/play/:filename', (req, res) => {
    const filename = path.basename(req.params.filename || '');
    if (!filename || filename.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(exportsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Export not found' });
    }

    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      if (start >= stat.size || end >= stat.size) {
        return res.status(416).send('Range not satisfiable');
      }
      const chunk = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Content-Length': chunk,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, { 'Content-Length': stat.size });
    fs.createReadStream(filePath).pipe(res);
  });

  router.get('/latest', (_req, res) => {
    if (!fs.existsSync(exportsDir)) return res.json({ filename: null, outputPath: null });
    const files = fs
      .readdirSync(exportsDir)
      .filter((f) => f.endsWith('.mp4') && !f.startsWith('.'))
      .map((f) => ({
        name: f,
        mtime: fs.statSync(path.join(exportsDir, f)).mtimeMs,
        size: fs.statSync(path.join(exportsDir, f)).size,
      }))
      .sort((a, b) => b.mtime - a.mtime);
    const latest = files[0];
    if (!latest) return res.json({ filename: null, outputPath: null });
    const outputPath = path.join(exportsDir, latest.name);
    res.json({ filename: latest.name, outputPath, size: latest.size });
  });

  return router;
}
