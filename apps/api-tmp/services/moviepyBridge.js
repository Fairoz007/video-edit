/**
 * Bridge to Python MoviePy pipeline for clip sequencing.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(__dirname, '../moviepy/moviepy_renderer.py');

export function runMoviePyPipeline(configPath, onProgress) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [SCRIPT, '--config', configPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    proc.stdout.on('data', (d) => {
      const line = d.toString();
      stdout += line;
      if (line.startsWith('PROGRESS:')) {
        const pct = parseFloat(line.replace('PROGRESS:', '').trim());
        onProgress?.(pct);
      }
    });

    let stderr = '';
    proc.stderr.on('data', (d) => {
      const text = d.toString();
      stderr += text;
      console.error('[MoviePy]', text);
    });

    proc.on('error', (err) => {
      reject(new Error(`MoviePy failed to start: ${err.message}`));
    });

    proc.on('close', (code, signal) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim().split('\n').pop());
          resolve(result);
        } catch {
          resolve({ success: true, output: stdout });
        }
      } else {
        const detail = stderr.trim() || signal || 'unknown error';
        reject(
          new Error(
            code == null
              ? `MoviePy was terminated (${signal || detail})`
              : `MoviePy exited with code ${code}: ${detail}`,
          ),
        );
      }
    });
  });
}
