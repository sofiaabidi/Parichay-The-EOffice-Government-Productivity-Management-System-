#!/bin/bash
# Script to upgrade PyTorch and fix compatibility issues

echo "🔧 Upgrading PyTorch and related packages..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Upgrade pip first
echo "Upgrading pip..."
pip install --upgrade pip

# Uninstall old PyTorch and related packages
echo "Uninstalling old packages..."
pip uninstall -y torch torchvision torchaudio sentence-transformers transformers huggingface-hub

# Install PyTorch 2.1+ (CPU version)
echo "Installing PyTorch 2.1+ (CPU version)..."
pip install torch>=2.1.0

# Install compatible versions of transformers and sentence-transformers
echo "Installing compatible transformers and sentence-transformers..."
pip install transformers>=4.35.0
pip install sentence-transformers>=2.3.1
pip install huggingface-hub>=0.20.0

echo ""
echo "✅ Installation complete!"
echo ""
echo "Verifying installation..."
python -c "import torch; print(f'PyTorch version: {torch.__version__}')"
python -c "from sentence_transformers import SentenceTransformer; print('✅ SentenceTransformer import successful!')"
echo ""
echo "You can now run: python train_sentiment_analysis.py"

