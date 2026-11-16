#!/usr/bin/env bash
# Safe, read-only checks before a licensed MICA/CUDA installation on WSL2.
# Never downloads packages, modifies drivers, accesses photos or asks for credentials.
set -uo pipefail

problems=0
warnings=0
say() { printf '%s\n' "$*"; }
pass() { say "[OK] $*"; }
warn() { say "[INFO] $*"; warnings=$((warnings + 1)); }
fail() { say "[BLOCKED] $*"; problems=$((problems + 1)); }

say 'Photo3D / MICA research environment — read-only preflight'
say '--------------------------------------------------------'
if [ -r /proc/sys/kernel/osrelease ] && grep -Eqi '(microsoft|wsl)' /proc/sys/kernel/osrelease; then
  pass 'WSL kernel detected.'
else
  fail 'This shell does not look like WSL. Open Ubuntu in WSL2 (not PowerShell).'
fi

if command -v git >/dev/null 2>&1; then
  pass "Git: $(git --version)"
else
  fail 'Git is missing. Install it in WSL before cloning MICA.'
fi
if command -v python3 >/dev/null 2>&1; then
  pass "System Python: $(python3 --version 2>&1)"
else
  warn 'System python3 is unavailable. An isolated Conda Python will be needed.'
fi

nvidia_cmd=''
if command -v nvidia-smi >/dev/null 2>&1; then
  nvidia_cmd="$(command -v nvidia-smi)"
elif [ -x /usr/lib/wsl/lib/nvidia-smi ]; then
  nvidia_cmd='/usr/lib/wsl/lib/nvidia-smi'
fi

if [ -z "$nvidia_cmd" ]; then
  fail 'nvidia-smi was not found inside WSL. Check the NVIDIA Windows driver and WSL2 integration.'
else
  gpu_report="$("$nvidia_cmd" --query-gpu=name,driver_version --format=csv,noheader 2>&1)"
  if [ "$?" -eq 0 ] && [ -n "$gpu_report" ]; then
    pass "CUDA-visible NVIDIA GPU (name, Windows driver): $gpu_report"
    case "$gpu_report" in
      *'RTX 40'*|*'Ada'*) warn 'Ada GPU detected. Original MICA pins CUDA 11.6; do not assume the old environment supports this GPU.' ;;
    esac
  else
    fail 'GPU command exists but could not query NVIDIA GPU through WSL.'
    say "  Error: $(printf '%s' "$gpu_report" | head -n 1)"
  fi
fi

if command -v conda >/dev/null 2>&1; then
  pass "Conda detected: $(conda --version 2>&1)"
else
  warn 'Conda is not installed in WSL yet. Miniforge is an option after GPU checks.'
fi
if [ -f "$HOME/MICA/demo.py" ]; then
  pass 'MICA clone detected at ~/MICA (not a model-readiness check).'
else
  warn 'MICA clone not yet detected at ~/MICA (normal for the first step).'
fi

say ''
if [ "$problems" -eq 0 ]; then
  say "RESULT: GPU/WSL prerequisite checks passed ($warnings informational note(s))."
  say 'NEXT: Review MICA/FLAME licenses and choose a compatible isolated CUDA environment.'
  exit 0
fi
say "RESULT: $problems prerequisite blocker(s), $warnings informational note(s)."
say 'Do not install a Linux NVIDIA display driver in WSL. Fix WSL/Windows driver access first.'
exit 2
