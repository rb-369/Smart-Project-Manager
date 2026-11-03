# ==============================================================================
# Start Thesys OUI-1 Generative UI Server (vLLM Engine)
# Model: https://huggingface.co/thesysdev/OUI-1
# Blog: https://openui.com/blog/oui-1
# ==============================================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting Thesys OUI-1 Text-Diffusion Generative UI Model" -ForegroundColor Green
Write-Host " Architecture: DiffusionGemma (26B-A4B-it) via vLLM" -ForegroundColor White
Write-Host " Target Output: openui-lang DSL stream" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan

# Verify vLLM is installed
if (-not (Get-Command vllm -ErrorAction SilentlyContinue)) {
    Write-Host "[!] vLLM is not detected in your current Python environment." -ForegroundColor Yellow
    Write-Host "    Install via: pip install 'vllm>=0.24'" -ForegroundColor White
    exit 1
}

Write-Host "[+] Launching OUI-1 on http://localhost:8001/v1 with FP8 quantization and 16k context window..." -ForegroundColor Cyan

vllm serve thesysdev/OUI-1 `
    --trust-remote-code `
    --max-model-len 16384 `
    --quantization fp8 `
    --served-model-name OUI-1 `
    --port 8001 `
    --host 0.0.0.0

