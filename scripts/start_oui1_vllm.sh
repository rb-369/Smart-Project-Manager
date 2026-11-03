#!/usr/bin/env bash
# ==============================================================================
# Start Thesys OUI-1 Generative UI Server (vLLM Engine)
# Model: https://huggingface.co/thesysdev/OUI-1
# Blog: https://openui.com/blog/oui-1
# ==============================================================================

set -euo pipefail

echo "========================================================"
echo " Starting Thesys OUI-1 Text-Diffusion Generative UI Model"
echo " Architecture: DiffusionGemma (26B-A4B-it) via vLLM"
echo " Target Output: openui-lang DSL stream"
echo "========================================================"

if ! command -v vllm &> /dev/null; then
    echo "[!] vLLM is not installed in your active environment."
    echo "    Install with: pip install 'vllm>=0.24'"
    exit 1
fi

echo "[+] Starting OUI-1 on http://0.0.0.0:8001/v1 with FP8 quantization..."

vllm serve thesysdev/OUI-1 \
    --trust-remote-code \
    --max-model-len 16384 \
    --quantization fp8 \
    --served-model-name OUI-1 \
    --port 8001 \
    --host 0.0.0.0

