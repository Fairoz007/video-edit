#!/usr/bin/env python3
"""
MoviePy automated documentary sequencing — Ken Burns, crossfades, audio sync.
Usage: python3 moviepy_renderer.py --config /path/to/config.json
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

MOVIEPY_V2 = False

try:
    from moviepy import (
        ImageClip,
        VideoFileClip,
        AudioFileClip,
        concatenate_videoclips,
        CompositeVideoClip,
    )
    from moviepy.video.fx import FadeIn, FadeOut

    MOVIEPY_V2 = True
except ImportError:
    try:
        from moviepy.editor import (
            ImageClip,
            VideoFileClip,
            AudioFileClip,
            concatenate_videoclips,
            CompositeVideoClip,
        )
        from moviepy.video.fx.all import fadein, fadeout
    except ImportError:
        print("ERROR: moviepy not installed. Run: pip install moviepy", file=sys.stderr)
        sys.exit(1)

RESOLUTIONS = {
    "1080p": (1920, 1080),
    "4k": (3840, 2160),
    "shorts": (1080, 1920),
    "reels": (1080, 1920),
    "youtube": (1920, 1080),
}

CROSSFADE_SEC = 0.55
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}


def apply_fades(clip, duration=0.5):
    if MOVIEPY_V2:
        return clip.with_effects([FadeIn(duration), FadeOut(duration)])
    return fadeout(fadein(clip, duration), duration)


def resize_clip(clip, size):
    if MOVIEPY_V2:
        return clip.resized(new_size=size)
    return clip.resize(size)


def set_clip_duration(clip, duration):
    if MOVIEPY_V2:
        return clip.with_duration(duration)
    return clip.set_duration(duration)


def set_clip_audio_volume(clip, volume):
    if volume > 0:
        return clip
    if MOVIEPY_V2:
        return clip.without_audio()
    return clip.without_audio()


def apply_playback_rate(clip, playback_rate):
    if abs(playback_rate - 1.0) < 0.001:
        return clip
    if MOVIEPY_V2:
        return clip.time_transform(lambda t: t * playback_rate).with_duration(
            clip.duration / playback_rate
        )
    return clip.fl_time(lambda t: t * playback_rate).set_duration(clip.duration / playback_rate)


def ken_burns(clip, zoom=1.12):
    """Slow zoom on stills."""
    if MOVIEPY_V2:
        try:
            return clip.resized(
                lambda t: 1 + (zoom - 1) * min(1.0, t / max(clip.duration, 0.01))
            )
        except TypeError:
            return clip
    return clip.resize(lambda t: 1 + (zoom - 1) * (t / max(clip.duration, 0.01)))


def apply_slide_offset(clip, transition):
    if transition != "slide" or MOVIEPY_V2:
        return clip
    return clip.set_position(
        lambda t: (int(80 * (1 - min(1, t / 0.5))), "center")
    )


def ffprobe_has_video(path: str) -> bool:
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=codec_type",
                "-of",
                "csv=p=0",
                path,
            ],
            capture_output=True,
            text=True,
            timeout=45,
            check=False,
        )
        return result.returncode == 0 and result.stdout.strip() == "video"
    except (OSError, subprocess.TimeoutExpired):
        return False


def file_too_small(path: Path, min_bytes: int = 48000) -> bool:
    try:
        return path.stat().st_size < min_bytes
    except OSError:
        return True


def looks_like_image(path: Path) -> bool:
    return path.suffix.lower() in IMAGE_EXT


def build_image_clip(path: Path, duration: float, size, effect: str, transition: str):
    clip = ImageClip(str(path), duration=duration)
    clip = resize_clip(clip, size)
    if effect == "ken-burns":
        clip = ken_burns(clip)
    clip = apply_slide_offset(clip, transition)
    fade_dur = 0.65 if transition in ("crossfade", "fade") else 0.45
    return apply_fades(clip, fade_dur)


def build_scene(scene, size):
    raw_path = scene.get("path")
    if not raw_path:
        return None

    path = Path(raw_path)
    if not path.exists() or file_too_small(path):
        print(f"WARN: skip missing/tiny asset {raw_path}", file=sys.stderr)
        return None

    duration = float(scene.get("duration", 5))
    trim_start = max(0.0, float(scene.get("trimStart", 0) or 0))
    trim_end = max(0.0, float(scene.get("trimEnd", 0) or 0))
    playback_rate = max(0.05, float(scene.get("playbackRate", 1) or 1))
    loop = bool(scene.get("loop", False))
    audio_volume = max(0.0, min(1.0, float(scene.get("audioVolume", 0) or 0)))
    media_type = scene.get("type", "image")
    transition = scene.get("transition", "crossfade")
    effect = scene.get("effect", "ken-burns")

    use_video = media_type == "video" and not looks_like_image(path)

    if use_video:
        if not ffprobe_has_video(str(path)):
            print(f"WARN: invalid video, trying as image {path}", file=sys.stderr)
            use_video = False

    if use_video:
        try:
            clip = VideoFileClip(str(path))
            source_duration = clip.duration or duration
            end = max(trim_start + 0.1, source_duration - trim_end)
            end = min(end, trim_start + duration * playback_rate, source_duration)
            if MOVIEPY_V2:
                clip = clip.subclipped(trim_start, end)
            else:
                clip = clip.subclip(trim_start, end)
            clip = apply_playback_rate(clip, playback_rate)
            target_duration = duration if loop else min(duration, max(0.1, clip.duration))
            clip = set_clip_duration(clip, target_duration)
            clip = set_clip_audio_volume(clip, audio_volume)
            clip = resize_clip(clip, size)
            clip = apply_slide_offset(clip, transition)
            fade_dur = 0.65 if transition in ("crossfade", "fade") else 0.45
            return apply_fades(clip, fade_dur)
        except Exception as exc:
            print(f"WARN: VideoFileClip failed for {path}: {exc}", file=sys.stderr)
            use_video = False

    try:
        return build_image_clip(path, duration, size, effect, transition)
    except Exception as exc:
        print(f"WARN: skip unreadable asset {path}: {exc}", file=sys.stderr)
        return None


def concatenate_with_crossfade(clips):
    if len(clips) <= 1:
        return clips[0] if clips else None

    if not MOVIEPY_V2:
        out = clips[0]
        for nxt in clips[1:]:
            out = out.crossfadein(CROSSFADE_SEC).set_end(out.duration)
            nxt = nxt.crossfadein(CROSSFADE_SEC)
            out = concatenate_videoclips([out, nxt], method="compose", padding=-CROSSFADE_SEC)
        return out

    positioned = []
    t = 0
    for i, clip in enumerate(clips):
        start = max(0, t - CROSSFADE_SEC) if i > 0 else 0
        if MOVIEPY_V2:
            positioned.append(clip.with_start(start))
        else:
            positioned.append(clip.set_start(start))
        t = start + clip.duration

    if MOVIEPY_V2:
        return CompositeVideoClip(positioned)
    return CompositeVideoClip(positioned).set_duration(t)


def render(config_path: str):
    with open(config_path) as f:
        config = json.load(f)

    resolution = config.get("resolution", "1080p")
    size = RESOLUTIONS.get(resolution, (1920, 1080))
    fps = config.get("fps", 30)
    output = config.get("output", "output.mp4")
    scenes = config.get("scenes", [])
    audio_path = config.get("audio")

    clips = []
    total = len(scenes)

    for i, scene in enumerate(scenes):
        pct = (i + 1) / max(total, 1) * 0.85
        print(f"PROGRESS:{pct:.2f}", flush=True)
        clip = build_scene(scene, size)
        if clip:
            clips.append(clip)

    if not clips:
        print(json.dumps({"success": False, "error": "No valid clips"}))
        sys.exit(1)

    print("PROGRESS:0.90", flush=True)
    video = concatenate_with_crossfade(clips)
    if video is None:
        video = concatenate_videoclips(clips, method="compose")

    if audio_path and Path(audio_path).exists():
        narration = AudioFileClip(audio_path)
        target = narration.duration
        if target > video.duration:
            if MOVIEPY_V2:
                video = video.with_duration(target)
            else:
                video = video.set_duration(target)
        elif video.duration > target + 0.5:
            if MOVIEPY_V2:
                video = video.with_duration(target)
            else:
                video = video.set_duration(target)
        if MOVIEPY_V2:
            video = video.with_audio(narration)
        else:
            video = video.set_audio(narration)

    Path(output).parent.mkdir(parents=True, exist_ok=True)
    video.write_videofile(
        output,
        fps=fps,
        codec="libx264",
        audio_codec="aac",
        preset="medium",
        threads=4,
        logger=None,
    )

    print("PROGRESS:1.0", flush=True)
    print(json.dumps({"success": True, "output": output}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    render(args.config)
