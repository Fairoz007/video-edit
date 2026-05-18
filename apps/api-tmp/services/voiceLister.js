/**
 * List installed system TTS voices (macOS say, Windows System.Speech, Linux espeak).
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execFileAsync = promisify(execFile);

function parseMacVoices(stdout) {
  const voices = [];
  for (const line of stdout.split('\n')) {
    const match = line.match(/^([^\s#]+)\s+([a-z]{2}_[A-Z]{2})/);
    if (match) {
      voices.push({
        id: match[1],
        name: match[1],
        locale: match[2],
        label: `${match[1]} (${match[2]})`,
      });
    }
  }
  const seen = new Set();
  return voices.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });
}

async function listMacVoices() {
  const { stdout } = await execFileAsync('say', ['-v', '?'], { maxBuffer: 4 * 1024 * 1024 });
  const voices = parseMacVoices(stdout);
  const english = voices.filter((v) => v.locale.startsWith('en'));
  return (english.length ? english : voices).sort((a, b) => a.name.localeCompare(b.name));
}

async function listWindowsVoices() {
  const ps = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.GetInstalledVoices() | ForEach-Object {
  $i = $_.VoiceInfo
  Write-Output ($i.Name + '|' + $i.Culture.Name)
}
`;
  const { stdout } = await execFileAsync(
    'powershell',
    ['-NoProfile', '-Command', ps],
    { maxBuffer: 2 * 1024 * 1024 },
  );
  const voices = [];
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes('|')) continue;
    const [name, locale] = trimmed.split('|');
    voices.push({
      id: name,
      name,
      locale: locale || 'en-US',
      label: locale ? `${name} (${locale})` : name,
    });
  }
  return voices.sort((a, b) => a.name.localeCompare(b.name));
}

async function listLinuxVoices() {
  try {
    const { stdout } = await execFileAsync('espeak', ['--voices']);
    const voices = [{ id: 'default', name: 'default', locale: 'en', label: 'espeak default' }];
    for (const line of stdout.split('\n').slice(1)) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const id = parts[4];
        voices.push({ id, name: id, locale: parts[3] || 'en', label: id });
      }
    }
    return voices;
  } catch {
    return [{ id: 'default', name: 'default', locale: 'en', label: 'espeak default' }];
  }
}

export async function listSystemVoices() {
  const platform = os.platform();
  let voices;
  if (platform === 'darwin') voices = await listMacVoices();
  else if (platform === 'win32') voices = await listWindowsVoices();
  else voices = await listLinuxVoices();

  const defaultVoice =
    voices.find((v) => v.id === 'Samantha' || v.id === 'Alex')?.id ||
    voices.find((v) => v.locale?.startsWith('en'))?.id ||
    voices[0]?.id ||
    null;

  return { platform, voices, defaultVoice };
}

export function pickVoice(voices, requested) {
  if (!voices?.length) return requested || 'Alex';
  if (requested && voices.some((v) => v.id === requested || v.name === requested)) {
    return requested;
  }
  return voices[0].id;
}
