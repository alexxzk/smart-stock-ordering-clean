#!/bin/bash

echo "🚀 Starting build process..."

# Set environment variables for better build performance
export PIP_NO_CACHE_DIR=1
export PIP_DISABLE_PIP_VERSION_CHECK=1

# Upgrade pip and install build dependencies
echo "📦 Upgrading pip and installing build dependencies..."
pip install --upgrade pip setuptools wheel

# Install requirements
echo "📦 Installing requirements..."
pip install -r requirements.txt

echo "✅ Build completed successfully!" 