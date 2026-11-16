#!/usr/bin/env python3
"""Run the actual upstream MICA demo in an isolated local research workflow.

This tool does NOT implement or imitate MICA. It requires the user's own
license-compliant MICA checkout, checkpoints and working CUDA environment.
No model weights, FLAME files or source photographs are uploaded to Photo3D.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

REQUIRED = (
    "demo.py",
    "data/pretrained/mica.tar",
    "data/FLAME2020/generic_model.pkl",
    "data/FLAME2020/head_template.obj",
    "data/FLAME2020/landmark_embedding.npy",
)
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def inspect_obj(path: Path) -> dict:
    """Validate that a genuine nonempty triangle mesh exists, without loading AI assets."""
    if not path.is_file():
        raise ValueError("MICA did not create mesh.obj. No valid reconstruction was produced.")
    if path.stat().st_size > 120 * 1024 * 1024:
        raise ValueError("Mesh exceeds the 120 MB inspection limit.")
    vertices = faces = 0
    low = [math.inf] * 3
    high = [-math.inf] * 3
    with path.open("r", encoding="utf-8", errors="strict") as handle:
        for line in handle:
            if line.startswith("v "):
                coords = line.split()
                if len(coords) < 4:
                    raise ValueError("Invalid OBJ vertex.")
                values = [float(v) for v in coords[1:4]]
                if not all(math.isfinite(v) for v in values):
                    raise ValueError("Mesh has a non-finite vertex.")
                vertices += 1
                for i, v in enumerate(values):
                    low[i], high[i] = min(low[i], v), max(high[i], v)
            elif line.startswith("f "):
                corners = line.split()[1:]
                if len(corners) != 3:
                    raise ValueError("Expected triangular MICA OBJ faces.")
                ids = []
                for corner in corners:
                    index = int(corner.split("/")[0])
                    if index <= 0:
                        raise ValueError("Expected positive OBJ vertex indices.")
                    ids.append(index)
                if len(set(ids)) != 3:
                    raise ValueError("Degenerate OBJ face.")
                if any(i > vertices for i in ids):
                    raise ValueError("OBJ face references missing or later vertices.")
                faces += 1
    if vertices < 100 or faces < 100:
        raise ValueError("Mesh is too small to qualify as a reconstructed head.")
    return {
        "vertices": vertices,
        "triangles": faces,
        "boundsMm": {
            "min": [round(v, 4) for v in low],
            "max": [round(v, 4) for v in high],
        },
    }


def check_environment(root: Path, image: Path | None, check_cuda: bool) -> list[str]:
    missing = [f"Missing MICA asset: {name}" for name in REQUIRED if not (root / name).is_file()]
    insight = Path.home() / ".insightface" / "models"
    for folder in ("antelopev2", "buffalo_l"):
        if not (insight / folder).is_dir():
            missing.append(f"InsightFace model folder missing: {insight / folder}")
    if image is not None:
        if image.suffix.lower() not in EXTENSIONS or not image.is_file():
            missing.append("Input must be an existing JPG, PNG or WebP image.")
        elif image.stat().st_size == 0 or image.stat().st_size > 20 * 1024 * 1024:
            missing.append("Input image must be nonempty and no larger than 20 MB.")
    if check_cuda:
        try:
            probe = subprocess.run(
                [sys.executable, "-c", "import torch; assert torch.cuda.is_available(), 'CUDA unavailable'"],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=25, check=False,
            )
            if probe.returncode:
                missing.append("CUDA PyTorch unavailable in this Python environment (MICA demo calls .cuda()).")
        except (OSError, subprocess.TimeoutExpired):
            missing.append("Could not verify CUDA PyTorch in this environment.")
    return missing


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run official MICA demo and validate its actual mesh.")
    parser.add_argument("--mica-root", type=Path, required=True, help="Your licensed MICA checkout")
    parser.add_argument("--input", type=Path, help="Local front portrait (JPG/PNG)")
    parser.add_argument("--output", type=Path, help="New empty output folder for private results")
    parser.add_argument("--check", action="store_true", help="Inspect model assets / CUDA; no inference")
    parser.add_argument("--license-acknowledged", action="store_true",
                        help="Confirm you have reviewed MICA, FLAME and InsightFace terms")
    args = parser.parse_args(argv)

    root = args.mica_root.expanduser().resolve()
    image = args.input.expanduser().resolve() if args.input else None
    missing = check_environment(root, image, check_cuda=True)
    if args.check:
        print(json.dumps({"provider": "MICA", "ready": not missing, "issues": missing}, indent=2))
        return 0 if not missing else 2
    if not args.license_acknowledged:
        parser.error("Review license terms, then add --license-acknowledged to run.")
    if image is None or args.output is None:
        parser.error("--input and --output are required for real inference.")
    if missing:
        print("\n".join(missing), file=sys.stderr)
        return 2
    output = args.output.expanduser().resolve()
    if output.is_dir() and any(output.iterdir()):
        raise SystemExit("Output must be an empty new directory. Refusing to mix old model results.")
    output.mkdir(parents=True, exist_ok=True)
    # MICA processes every file in -i; stage exactly ONE user-selected photo.
    with tempfile.TemporaryDirectory(prefix="photo3d-mica-") as scratch:
        temp = Path(scratch)
        capture_dir = temp / "input"
        capture_dir.mkdir()
        staged = capture_dir / ("subject" + image.suffix.lower())
        shutil.copy2(image, staged)
        try:
            proc = subprocess.run(
                [
                    sys.executable, "demo.py",
                    "-i", str(capture_dir),
                    "-o", str(output),
                    "-a", str(temp / "arcface"),
                    "-m", str(root / "data/pretrained/mica.tar"),
                ],
                cwd=str(root), timeout=1200, check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise SystemExit("Official MICA inference timed out; do not treat incomplete output as success.") from exc
    if proc.returncode:
        raise SystemExit(f"Official MICA demo exited with code {proc.returncode}. See its errors above.")
    mesh = output / "subject" / "mesh.obj"
    report = inspect_obj(mesh)
    manifest = {
        "schema": "photo3d.research-mesh.v1",
        "provider": "MICA",
        "inference": {"executed": True, "upstream": "Zielon/MICA demo.py", "subjectCount": 1},
        "geometry": {
            "file": "subject/mesh.obj",
            "units": "millimeters-as-exported-by-upstream",
            "isFullHeadGuaranteed": False,
            "rigged": False,
            "hasPhotoTexture": False,
            **report,
        },
        "inputViewsUsed": ["front"],
        "modelLicense": "MICA non-commercial research/education/art; FLAME and InsightFace separate",
        "privacy": {"photoIncludedInManifest": False, "cloudUploadByWrapper": False},
        "createdUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    (output / "photo3d-result.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
