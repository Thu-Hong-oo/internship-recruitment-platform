# Quick script to setup ChromaDB - Chỉ cần thay KEY_NAME

# ============================================
# THAY ĐỔI KEY NAME Ở ĐÂY:
# ============================================
$KEY_NAME = "YOUR_KEY_NAME_HERE"  # <-- Thay bằng key name thực tế của bạn

# ============================================
# Chạy script
# ============================================
.\setup-chromadb-ec2-aws-cli.ps1 `
  -InstanceType "t3.small" `
  -KeyName $KEY_NAME `
  -Region "ap-southeast-1"

