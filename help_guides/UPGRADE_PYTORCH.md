# Upgrade PyTorch to Fix Compatibility

## Quick Fix

Run this command in your virtual environment:

```bash
cd "/Users/ankitasagar/Desktop/SIH NEW/Final copy 5/gov-productivity-backend"
pip install --upgrade torch sentence-transformers transformers huggingface-hub
```

This will:
- Upgrade PyTorch from 2.0.1 to 2.1+ (fixes `torch.compiler` error)
- Upgrade sentence-transformers (fixes `cached_download` error)
- Ensure all packages are compatible

## Verify

After upgrading, verify the installation:

```bash
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
# Should show 2.1.0 or higher

python -c "from sentence_transformers import SentenceTransformer; print('✅ All imports work!')"
```

## Then Train

```bash
python train_sentiment_analysis.py
```

