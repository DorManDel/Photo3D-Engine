# Photo3D — MICA setup: Step 1 (Windows 11 + WSL Ubuntu + Ada GPU)

This is a **non-destructive system diagnostic**, not a model installation.
It does not download packages, change WSL, install drivers, access photos
or request license credentials. The user must run it locally; ChatGPT
cannot execute a command in their own Windows/WSL terminal.

## Run this first

In **PowerShell**:

```powershell
wsl --list --verbose
wsl
```

Inside **Ubuntu/WSL** (not PowerShell):

```bash
cd ~
if [ -d Photo3D-Engine/.git ]; then
  git -C Photo3D-Engine pull --ff-only
else
  git clone https://github.com/DorManDel/Photo3D-Engine.git
fi
bash ~/Photo3D-Engine/tools/mica/diagnose_wsl.sh
```

Expected diagnosis checks: WSL kernel, Git, Python, NVIDIA GPU visibility and
Windows driver version, and optionally Conda and local MICA clone presence.
A missing Conda or MICA checkout is **informational** during Step 1. Missing
GPU visibility is blocking; do not install the model environment yet.
If Git is missing, install Git using your Ubuntu package manager first.

## Why we check compatibility before installing

The original MICA `environment.yml` pins Python 3.9 and PyTorch 1.13 with
CUDA 11.6. The user's RTX 4080 Super is Ada (compute capability 8.9).
CUDA Toolkit's native Ada support begins at 11.8. Older binaries can have
forward-compatibility in some circumstances, but **this exact old stack is
not a tested match for the new GPU**; do not assume it will work. Installing
the entire upstream environment blindly could waste time or fail.

In WSL, NVIDIA instructs users to install the **Windows NVIDIA display
driver only**, not a separate Linux NVIDIA display driver in Ubuntu.
Do not run `sudo apt install nvidia-driver-*` or `cuda-drivers` inside WSL.

We will inspect the exact outputs and select a **separate Conda environment**
for the research model without modifying the user's existing Unity, Python
coursework or WSL development environments.

Official reference sources:
- NVIDIA CUDA on WSL https://docs.nvidia.com/cuda/wsl-user-guide/
- NVIDIA CUDA architecture matrix https://docs.nvidia.com/datacenter/tesla/drivers/latest/cuda-toolkit-driver-and-architecture-matrix.html
- Official Conda Miniforge https://github.com/conda-forge/miniforge
- MICA environment https://github.com/Zielon/MICA/blob/master/environment.yml

## Next stages (not completed by this preflight)

1. Review MICA's non-commercial license and FLAME/InsightFace model terms.
2. Create an isolated compatible Python/CUDA environment; smoke-test
   `torch.cuda.is_available()` and an actual GPU tensor operation.
3. Obtain model checkpoints individually through official licensed sources.
   Do not use the upstream insecure/credential-based `install.sh` blindly.
4. Run `python tools/mica/run_mica.py --mica-root ~/MICA --check`.
5. Only after all checks pass, explicitly run one real photo through
   official MICA, then import the resulting `mesh.obj` into the web lab.

`diagnose_wsl.sh` does **not** attest that a model is installed or that
reconstruction inference has been performed. Preserve that distinction
in PCM, CI and user-facing UI.
