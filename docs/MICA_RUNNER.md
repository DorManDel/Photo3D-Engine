# M1c — Run a real MICA face-shape reconstruction (offline research)

**This is a local GPU research adapter.** The GitHub Pages site does **not**
execute MICA inference. We invoke the upstream `Zielon/MICA` `demo.py`
only when a user explicitly runs the command on a licensed local checkout.
No model weights, FLAME data, input photos or face-identity codes go into
the Photo3D GitHub repo.

## What we are trying to learn

The existing browser Photo Lab creates a **partially open MediaPipe 2.5D
face mask** with source-photo texture, not a complete head.

MICA estimates a **metrical FLAME facial shape**, with much more prior
knowledge of human faces; it exports `mesh.obj`, `mesh.ply`, FLAME shape
parameters and landmarks. It still does **not** create all your hair,
eyeballs, teeth, clothes or a body rig. Its `mesh.obj` is usually
**untextured**. The official demo writes mesh coordinates in **millimeters**.
These units are different from Photo3D MediaPipe's arbitrary relative depth.

We first inspect the result independently, then compare it against the
browser baseline. A visual similarity comparison is not yet a numerical
identity/geometry benchmark.

## 0. Legal, security and hardware prerequisites

- MICA code/model: non-commercial peaceful scientific research, education
  or artistic use as defined by its LICENSE; redistributing weights or
  the model is restricted. Other uses require permissions from the owner.
- FLAME2020: separate Max Planck academic/non-commercial license, account
  and individual model download.
- InsightFace model weights: review their separate usage terms as well.
- The original MICA `demo.py` runs on **CUDA**: Linux/WSL GPU support, a
  compatible NVIDIA driver, PyTorch with CUDA and sufficient VRAM required.
- MICA `environment.yml` pins older Python 3.9, PyTorch 1.13/CUDA 11.6
  packages. Those versions may require environment troubleshooting in 2026.
  An RTX 4080 Super alone does not guarantee they install or run.
- **Do not run upstream MICA's `install.sh` blindly.** It includes a
  credential-based download and disables certificate verification in one
  download command. Obtain FLAME assets through the official HTTPS account
  page manually, with no passwords in terminal logs or source code.
- Use photographs you own or have permission to process.

Official sources:
- https://github.com/Zielon/MICA
- https://github.com/Zielon/MICA/blob/master/LICENSE
- https://flame.is.tue.mpg.de/modellicense.html
- https://github.com/Zielon/MICA/blob/master/demo.py

## 1. Set up the separately licensed model (WSL/Linux)

From a Linux shell with working NVIDIA GPU access:

```bash
nvidia-smi

# Put these repos alongside each other, outside the public Photo3D assets.
git clone https://github.com/DorManDel/Photo3D-Engine.git
git clone https://github.com/Zielon/MICA.git

cd MICA
conda env create -f environment.yml
conda activate MICA
python -c "import torch; print(torch.__version__, torch.cuda.is_available())"
```

The last command must print `True` for CUDA availability.

Download licensed assets **manually** through the original authors' links
(they are intentionally not fetched or copied by this wrapper):

| Exact location in your MICA checkout | Origin |
| --- | --- |
| `data/pretrained/mica.tar` | MICA pretrained checkpoint link in its README |
| `data/FLAME2020/generic_model.pkl` | FLAME2020 licensed download |
| `data/FLAME2020/head_template.obj` | FLAME2020 licensed download |
| `data/FLAME2020/landmark_embedding.npy` | FLAME2020 licensed download |
| `~/.insightface/models/antelopev2/` | InsightFace checkpoint referenced by MICA |
| `~/.insightface/models/buffalo_l/` | InsightFace checkpoint referenced by MICA |

The MICA README's path discussion and current source are not entirely
consistent. **Its actual config points to `data/FLAME2020`** for the
three FLAME geometry files. These paths are checked by Photo3D's preflight.

## 2. Check your local environment — no inference

In the activated `MICA` conda environment:

```bash
python ../Photo3D-Engine/tools/mica/run_mica.py \
  --mica-root ./ \
  --check
```

This checks the expected checkpoint/FLAME paths, InsightFace folders
and `torch.cuda.is_available()`. Exit code 0 means preflight passed, not
that reconstruction quality or runtime has been verified. Failed checks
produce actionable messages and no fake mesh.

## 3. Run one actual portrait through MICA

From the `MICA` directory:

```bash
python ../Photo3D-Engine/tools/mica/run_mica.py \
  --mica-root ./ \
  --input "/mnt/c/Users/YOUR_WINDOWS_USERNAME/Pictures/front.jpg" \
  --output "./photo3d-private-output/first-head" \
  --license-acknowledged
```

Use your real local image path. The output folder must be new or empty.
The wrapper stages **one** image in a temporary directory and calls the
original MICA `demo.py` with the selected CUDA/PyTorch environment.
It does not fake vertices if MICA fails. The wrapper refuses to call the
model without an explicit license acknowledgment.

MICA's original code may download or open model assets through its own
dependencies, but **Photo3D never automatically uploads the image to an
online reconstruction API**.

After a successful run, you should have:

```text
photo3d-private-output/first-head/
  subject/
    mesh.obj            # actual estimated face-shape geometry (MICA mm)
    mesh.ply            # alternative original output
    identity.npy        # shape coefficients; private
    kpt7.npy
    kpt68.npy
  photo3d-result.json  # geometry counts and provenance, no photo bytes
```

If no valid `mesh.obj` exists, our runner fails. It does not pretend
there was a reconstruction. Keep shape coefficients and outputs private.

## 4. Use the web comparison tool — no server required

1. Visit https://dormandel.github.io/Photo3D-Engine/#reconstruction
2. In **Front**, select the same portrait; generate the MediaPipe baseline.
3. Scroll to **MICA Head Reconstruction — Import & Inspect**.
4. Import the real `subject/mesh.obj` generated offline.
5. Drag / pinch to orbit. Compare the **shape** and eye/jaw boundaries
   against the open face mask above. The views do not share a calibrated
   camera yet and should not be interpreted as a metric overlay.
6. Optionally export the imported, **untextured** head geometry to GLB.
   Import this GLB/OBJ into Blender for visual inspection.

The site does not verify the OBJ's author or prove it was created by
MICA; it only validates mesh structure and deliberately marks its
provenance as user-claimed. You can import other valid triangle OBJ data
for testing, but don't label it as a MICA reconstruction.

## Boundaries and the next acceptance gate

- **Working now:** offline wrapper code calling the genuine upstream model
  *when installed and licensed*, mesh validation, private manifest and
  browser import/orbit/untextured GLB conversion.
- **Not proven here:** actual MICA inference on your RTX/WSL, exact face
  fidelity, a Blender import on your machine or performance benchmarks.
- **Not implemented:** DECA runner, automatic multi-photo fusion, photo
  texture on MICA mesh, true complete head, eyes/mouth rigs, FBX/VRM and
  live avatar retargeting.

Next we need **one real MICA output** and a visual Blender/site comparison,
then we can define common head-asset coordinates, colors, material and
animation/eye boundaries.
