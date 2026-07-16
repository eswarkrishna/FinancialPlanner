#!/usr/bin/env python3
"""Generate timed narration and mux with demo video using edge-tts + ffmpeg."""

from __future__ import annotations

import asyncio
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

VOICE = "en-US-AriaNeural"
RATE = "+5%"  # Slightly faster for demo pacing
VIDEO_IN = Path("/opt/cursor/artifacts/financial-planner-youtube-final.mp4")
VIDEO_OUT = Path("/opt/cursor/artifacts/financial-planner-youtube-with-audio.mp4")
SCRIPT = Path(__file__).resolve().parents[1] / "docs/video/narration-script.txt"


def run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kwargs)


def probe_duration(path: Path) -> float:
    out = run(
        [
            "ffprobe",
            "-v",
            "quiet",
            "-show_entries",
            "format=duration",
            "-of",
            "csv=p=0",
            str(path),
        ]
    )
    return float(out.stdout.strip())


def parse_script(path: Path) -> list[tuple[float, str]]:
    segments: list[tuple[float, str]] = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        start, _, text = line.partition("|")
        segments.append((float(start), text.strip()))
    return segments


async def synthesize(text: str, out: Path) -> None:
    import edge_tts

    communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
    await communicate.save(str(out))


async def main() -> int:
    if not VIDEO_IN.exists():
        print(f"Missing video: {VIDEO_IN}", file=sys.stderr)
        return 1

    video_duration = probe_duration(VIDEO_IN)
    segments = parse_script(SCRIPT)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        timeline: list[tuple[float, Path, float]] = []

        for i, (start, text) in enumerate(segments):
            wav = tmp_path / f"seg_{i:02d}.mp3"
            await synthesize(text, wav)
            dur = probe_duration(wav)
            timeline.append((start, wav, dur))
            print(f"  seg {i}: start={start:.1f}s dur={dur:.1f}s — {text[:50]}…")

        # Build ffmpeg filter: delay each segment to its start time, mix together
        inputs: list[str] = []
        filter_parts: list[str] = []
        for i, (start, wav, _dur) in enumerate(timeline):
            inputs.extend(["-i", str(wav)])
            delay_ms = int(start * 1000)
            filter_parts.append(f"[{i}:a]adelay={delay_ms}|{delay_ms},apad[a{i}]")

        mix_inputs = "".join(f"[a{i}]" for i in range(len(timeline)))
        filter_parts.append(
            f"{mix_inputs}amix=inputs={len(timeline)}:duration=longest:dropout_transition=0,volume=1.2[aout]"
        )
        filter_complex = ";".join(filter_parts)

        narration = tmp_path / "narration.m4a"
        run(
            [
                "ffmpeg",
                "-y",
                *inputs,
                "-filter_complex",
                filter_complex,
                "-map",
                "[aout]",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                "-t",
                str(video_duration),
                str(narration),
            ]
        )

        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(VIDEO_IN),
                "-i",
                str(narration),
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                "-shortest",
                "-movflags",
                "+faststart",
                str(VIDEO_OUT),
            ]
        )

    out_dur = probe_duration(VIDEO_OUT)
    size_mb = VIDEO_OUT.stat().st_size / 1024 / 1024
    print(f"\nDone: {VIDEO_OUT}")
    print(f"  Duration: {out_dur:.1f}s, Size: {size_mb:.1f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
