#!/bin/bash
# Script to fix sentence-transformers compatibility issues
# Run this if you encounter import errors with cached_download or torch.compiler

echo "Updating PyTorch and sentence-transformers packages..."

# Upgrade pip first
pip install --upgrade pip

# Uninstall conflicting packages
pip uninstall -y torch sentence-transformers transformers huggingface-hub

# Install compatible versions (PyTorch 2.1+ is required)
pip install torch>=2.1.0
pip install sentence-transformers>=2.3.1
pip install transformers>=4.35.0
pip install huggingface-hub>=0.20.0

echo "✅ Installation complete!"
echo "PyTorch version: $(python -c 'import torch; print(torch.__version__)')"
echo "You can now run: python train_sentiment_analysis.py"

