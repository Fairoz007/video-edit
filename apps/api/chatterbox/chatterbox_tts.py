#!/usr/bin/env python3
"""
Chatterbox-TTS worker for DocuForge.
- Chatterbox-Turbo: English narration, paralinguistic tags ([laugh], [chuckle])
- Chatterbox-Multilingual v3: 23+ languages (t3_model=v3)

JSON line protocol on stdin/stdout when run with --serve.
"""
from __future__ import annotations

import argparse
import inspect
import json
import os
import sys
import threading
import warnings

# diffusers LoRA deprecation — harmless until chatterbox-tts upgrades
warnings.filterwarnings("ignore", category=FutureWarning, module=r"diffusers(\..*)?")
import traceback
from pathlib import Path

_ENGINE: "ChatterboxEngine | None" = None
_ENGINE_LOCK = threading.Lock()

ROOT = Path(__file__).resolve().parent
VOICES_PATH = ROOT / "voices.json"
REF_VOICES_DIR = ROOT / "refs"


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def emit(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def load_voice_catalog() -> dict:
    with open(VOICES_PATH, encoding="utf-8") as f:
        return json.load(f)


def resolve_device() -> str:
    forced = os.getenv("CHATTERBOX_DEVICE", "").strip().lower()
    if forced in ("cuda", "mps", "cpu"):
        return forced
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"
        if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            return "mps"
    except Exception:
        pass
    return "cpu"


def find_voice(voice_id: str | None) -> dict:
    catalog = load_voice_catalog()
    voices = catalog.get("voices") or []
    if voice_id:
        for v in voices:
            if v["id"] == voice_id:
                return v
    default_id = catalog.get("defaultVoice") or (voices[0]["id"] if voices else None)
    for v in voices:
        if v["id"] == default_id:
            return v
    if voices:
        return voices[0]
    raise RuntimeError("No voices configured in voices.json")


def ref_path_for_voice(voice: dict) -> str | None:
    ref = voice.get("ref")
    if ref:
        p = ROOT / ref
        if p.is_file():
            return str(p)
    candidate = REF_VOICES_DIR / f"{voice['id']}.wav"
    if candidate.is_file():
        return str(candidate)
    return None


def _ensure_perth_watermarker() -> None:
    """Perth can fail to import on first load; repair before ChatterboxTurboTTS.__init__."""
    import perth

    if perth.PerthImplicitWatermarker is not None:
        return
    try:
        from perth.perth_net.perth_net_implicit.perth_watermarker import PerthImplicitWatermarker

        perth.PerthImplicitWatermarker = PerthImplicitWatermarker
    except ImportError as err:
        raise RuntimeError(
            "Perth watermark library failed to load. Run: npm run setup"
        ) from err


def get_shared_engine() -> "ChatterboxEngine":
    global _ENGINE
    with _ENGINE_LOCK:
        if _ENGINE is None:
            _ENGINE = ChatterboxEngine()
        return _ENGINE


class ChatterboxEngine:
    def __init__(self) -> None:
        self.device = resolve_device()
        self._turbo = None
        self._mtl = None
        self._mtl_t3 = os.getenv("CHATTERBOX_MTL_T3", "v3").strip() or "v3"
        log(f"[Chatterbox] device={self.device} mtl_t3={self._mtl_t3}")

    def _import_torchaudio(self):
        import torchaudio as ta

        return ta

    def get_turbo(self):
        if self._turbo is None:
            _ensure_perth_watermarker()
            from chatterbox.tts_turbo import ChatterboxTurboTTS

            log("[Chatterbox] Loading Chatterbox-Turbo…")
            self._turbo = ChatterboxTurboTTS.from_pretrained(device=self.device)
            log("[Chatterbox] Turbo ready")
        return self._turbo

    def get_mtl(self, t3_model: str | None = None):
        t3 = t3_model or self._mtl_t3
        if self._mtl is None:
            from chatterbox.mtl_tts import ChatterboxMultilingualTTS

            params = inspect.signature(ChatterboxMultilingualTTS.from_pretrained).parameters
            supports_t3 = "t3_model" in params

            log(f"[Chatterbox] Loading Multilingual T3 ({t3})…")
            if supports_t3:
                self._mtl = ChatterboxMultilingualTTS.from_pretrained(
                    device=self.device,
                    t3_model=t3,
                )
            else:
                if t3 and t3 not in ("v2", "t3_mtl23ls_v2"):
                    log(
                        "[Chatterbox] Installed chatterbox-tts has no t3_model support; "
                        "using v2. Run: npm run setup"
                    )
                self._mtl = ChatterboxMultilingualTTS.from_pretrained(device=self.device)
            log("[Chatterbox] Multilingual ready")
        return self._mtl

    def synthesize(
        self,
        text: str,
        output_wav: str,
        voice_id: str | None = None,
        exaggeration: float | None = None,
        cfg_weight: float | None = None,
    ) -> dict:
        import torch

        voice = find_voice(voice_id)
        engine = voice.get("engine", "turbo")
        language = voice.get("language", "en")
        ref = ref_path_for_voice(voice)
        out_path = Path(output_wav)
        out_path.parent.mkdir(parents=True, exist_ok=True)

        text = (text or "").strip()
        if not text:
            raise ValueError("Text is required for synthesis")

        ta = self._import_torchaudio()

        if engine == "multilingual":
            model = self.get_mtl(voice.get("t3Model"))
            kwargs = {
                "text": text,
                "language_id": language,
            }
            if ref:
                kwargs["audio_prompt_path"] = ref
            kwargs["exaggeration"] = float(
                exaggeration if exaggeration is not None else voice.get("exaggeration", 0.5)
            )
            kwargs["cfg_weight"] = float(
                cfg_weight if cfg_weight is not None else voice.get("cfgWeight", 0.5)
            )
            wav = model.generate(**kwargs)
        else:
            model = self.get_turbo()
            kwargs = {"text": text}
            if ref:
                kwargs["audio_prompt_path"] = ref
                kwargs["exaggeration"] = float(
                    exaggeration if exaggeration is not None else voice.get("exaggeration", 0.0)
                )
            wav = model.generate(**kwargs)

        if not isinstance(wav, torch.Tensor):
            wav = torch.tensor(wav)
        if wav.dim() == 1:
            wav = wav.unsqueeze(0)

        ta.save(str(out_path), wav.cpu(), model.sr)

        return {
            "path": str(out_path),
            "sampleRate": model.sr,
            "voice": voice["id"],
            "engine": engine,
            "language": language,
            "device": self.device,
        }


def cmd_list_voices(_payload: dict) -> dict:
    catalog = load_voice_catalog()
    return {
        "platform": "chatterbox",
        "provider": "Resemble AI Chatterbox-TTS",
        "device": resolve_device(),
        "models": {
            "turbo": "ResembleAI/chatterbox-turbo",
            "multilingual": f"ResembleAI/chatterbox (t3={os.getenv('CHATTERBOX_MTL_T3', 'v3')})",
        },
        "voices": catalog.get("voices", []),
        "defaultVoice": catalog.get("defaultVoice"),
        "paralinguisticTags": ["[laugh]", "[chuckle]", "[cough]", "[sigh]"],
    }


def cmd_setup() -> dict:
    """Download / cache Hugging Face weights (run after pip install)."""
    models_env = os.getenv("CHATTERBOX_SETUP_MODELS", "turbo").strip()
    which = [m.strip().lower() for m in models_env.split(",") if m.strip()]
    if not which:
        which = ["turbo"]
    engine = get_shared_engine()
    warmed: list[str] = []
    if "turbo" in which:
        engine.get_turbo()
        warmed.append("turbo")
    if "multilingual" in which or "mtl" in which:
        engine.get_mtl()
        warmed.append("multilingual")
    return {"ok": True, "device": engine.device, "warmed": warmed}


def cmd_health(engine: ChatterboxEngine | None) -> dict:
    device = resolve_device()
    cuda = False
    try:
        import torch

        cuda = torch.cuda.is_available()
    except Exception:
        pass
    return {
        "ok": True,
        "device": device,
        "cuda": cuda,
        "engineLoaded": {
            "turbo": engine is not None and engine._turbo is not None,
            "multilingual": engine is not None and engine._mtl is not None,
        },
    }


def cmd_warmup(_engine: ChatterboxEngine, payload: dict) -> dict:
    engine = get_shared_engine()
    which = payload.get("models") or ["turbo"]
    if "turbo" in which:
        engine.get_turbo()
    if "multilingual" in which or "mtl" in which:
        engine.get_mtl()
    return {"ok": True, "warmed": which}


def serve_loop() -> int:
    # Process is alive and accepting commands (model loads on first synthesize).
    emit({"ok": True, "ready": True, "result": {"ready": True, "device": resolve_device()}})

    if os.getenv("CHATTERBOX_WARMUP", "0") not in ("0", "false", "no"):

        def _warmup() -> None:
            try:
                get_shared_engine().get_turbo()
                log("[Chatterbox] Background turbo warmup complete")
            except Exception as err:
                log(f"[Chatterbox] Warmup turbo failed: {err}")

        threading.Thread(target=_warmup, daemon=True).start()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            cmd = req.get("cmd")
            payload = req.get("payload") or {}
            req_id = req.get("id")

            if cmd == "ping":
                result = {"pong": True, "ready": True, "device": resolve_device()}
            elif cmd == "health":
                result = cmd_health(_ENGINE)
            elif cmd == "list_voices":
                result = cmd_list_voices(payload)
            elif cmd == "warmup":
                result = cmd_warmup(get_shared_engine(), payload)
            elif cmd == "synthesize":
                wav_out = payload.get("outputWav") or payload.get("output")
                if not wav_out:
                    raise ValueError("outputWav is required")
                with _ENGINE_LOCK:
                    result = get_shared_engine().synthesize(
                        text=payload.get("text", ""),
                        output_wav=wav_out,
                        voice_id=payload.get("voice"),
                        exaggeration=payload.get("exaggeration"),
                        cfg_weight=payload.get("cfgWeight"),
                    )
            elif cmd == "shutdown":
                emit({"id": req_id, "ok": True, "result": {"shutdown": True}})
                return 0
            else:
                raise ValueError(f"Unknown command: {cmd}")

            emit({"id": req_id, "ok": True, "result": result})
        except Exception as err:
            req_id = None
            try:
                req_id = req.get("id")
            except NameError:
                pass
            emit(
                {
                    "id": req_id,
                    "ok": False,
                    "error": str(err),
                    "trace": traceback.format_exc(),
                }
            )
    return 0


def cli_synthesize(args: argparse.Namespace) -> int:
    result = get_shared_engine().synthesize(
        text=args.text,
        output_wav=args.output,
        voice_id=args.voice,
    )
    print(json.dumps(result))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="DocuForge Chatterbox-TTS worker")
    parser.add_argument("--serve", action="store_true", help="JSON line daemon on stdin")
    parser.add_argument("--list-voices", action="store_true")
    parser.add_argument("--health", action="store_true")
    parser.add_argument(
        "--setup",
        action="store_true",
        help="Download Chatterbox model weights (turbo by default; set CHATTERBOX_SETUP_MODELS)",
    )
    parser.add_argument("--text", type=str)
    parser.add_argument("--voice", type=str)
    parser.add_argument("--output", type=str, help="Output .wav path")
    args = parser.parse_args()

    if args.serve:
        return serve_loop()
    if args.list_voices:
        print(json.dumps(cmd_list_voices({})))
        return 0
    if args.health:
        print(json.dumps(cmd_health(None)))
        return 0
    if args.setup:
        print(json.dumps(cmd_setup()))
        return 0
    if args.text and args.output:
        return cli_synthesize(args)
    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
