#!/bin/bash
# Install Python dependencies for Sentence-BERT service
cd /var/app/current
if [ -f python/requirements.txt ]; then
    pip3 install --user --no-cache-dir -r python/requirements.txt
fi

