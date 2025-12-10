# 🔧 Koyeb Deployment Fixes

**Date:** 2025-12-10  
**Issues Fixed:** Multilingual NER crash loop, Dialogflow credentials error

---

## 🐛 Issues Identified

### 1. Multilingual NER Service Crash Loop

**Symptoms:**
- Process exits with code 1 repeatedly
- Auto-restart loop every 2 seconds
- Stderr shows empty errors

**Root Causes:**
- Python script may not exist in container
- Python not installed or not in PATH
- Dependencies missing (transformers, torch, etc.)

### 2. Dialogflow Credentials Error

**Symptoms:**
```
Error: ENOENT: no such file or directory, open '/app/{'
```

**Root Cause:**
- `GOOGLE_APPLICATION_CREDENTIALS` environment variable has invalid value (likely `{` or malformed JSON)

---

## ✅ Fixes Applied

### 1. Multilingual NER Service

**Changes:**
- ✅ Added file existence check before starting
- ✅ Added Python command detection (python3 vs python)
- ✅ Added max restart attempts (5) to prevent infinite loop
- ✅ Graceful fallback when service unavailable
- ✅ Environment variable to disable: `ENABLE_MULTILINGUAL_NER=false`

**Code Changes:**
- `backend/src/services/multilingualNERService.js`

**Features:**
- Checks if Python script exists
- Validates Python installation
- Limits restart attempts
- Falls back gracefully when unavailable

### 2. Dialogflow Service

**Changes:**
- ✅ Validate credentials path before using
- ✅ Check if file exists
- ✅ Handle invalid paths gracefully
- ✅ Fallback to default credentials if file not found

**Code Changes:**
- `backend/src/services/ai/dialogflowService.js`

**Features:**
- Validates `GOOGLE_APPLICATION_CREDENTIALS` path
- Checks file existence
- Graceful fallback to default credentials
- Better error messages

---

## 🚀 Deployment Configuration

### Environment Variables

**To disable Multilingual NER (if causing issues):**

```bash
ENABLE_MULTILINGUAL_NER=false
```

**To fix Dialogflow credentials:**

```bash
# Option 1: Remove invalid value (use default credentials)
# Remove GOOGLE_APPLICATION_CREDENTIALS or set to empty

# Option 2: Set correct path
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Option 3: Use default credentials (for Cloud Run, GCE, etc.)
# Don't set GOOGLE_APPLICATION_CREDENTIALS
```

**To specify Python command:**

```bash
PYTHON_CMD=python3  # or python
```

---

## 📋 Recommended Koyeb Configuration

### Environment Variables

```bash
# Disable Multilingual NER if Python not available
ENABLE_MULTILINGUAL_NER=false

# Or ensure Python is available
PYTHON_CMD=python3

# Fix Dialogflow credentials
# Remove GOOGLE_APPLICATION_CREDENTIALS if invalid
# Or set to correct path
```

### Dockerfile Considerations

If using Multilingual NER, ensure:

```dockerfile
# Install Python 3
RUN apt-get update && apt-get install -y python3 python3-pip

# Install Python dependencies
COPY python/requirements.txt /app/python/
RUN pip3 install -r /app/python/requirements.txt
```

---

## 🔍 Troubleshooting

### Multilingual NER Still Crashing?

1. **Check if Python is available:**
   ```bash
   which python3
   python3 --version
   ```

2. **Check if script exists:**
   ```bash
   ls -la /app/python/multilingual_ner_server.py
   ```

3. **Disable service:**
   ```bash
   ENABLE_MULTILINGUAL_NER=false
   ```

4. **Check logs for specific error:**
   - Look for Python error messages in stderr
   - Check if dependencies are installed

### Dialogflow Still Erroring?

1. **Check credentials path:**
   ```bash
   echo $GOOGLE_APPLICATION_CREDENTIALS
   ```

2. **Remove invalid value:**
   ```bash
   # In Koyeb, remove or clear GOOGLE_APPLICATION_CREDENTIALS
   ```

3. **Use default credentials:**
   - For Cloud Run/GCE: Don't set GOOGLE_APPLICATION_CREDENTIALS
   - System will use default service account

---

## ✅ Expected Behavior After Fix

### Multilingual NER

**If enabled and working:**
- ✅ Starts successfully
- ✅ Loads model
- ✅ Ready to accept requests

**If disabled or unavailable:**
- ✅ Logs warning once
- ✅ Service disabled gracefully
- ✅ System uses fallback methods
- ✅ No crash loop

### Dialogflow

**If credentials valid:**
- ✅ Initializes successfully
- ✅ Ready to detect intents

**If credentials invalid:**
- ✅ Logs warning once
- ✅ Falls back to default credentials
- ✅ Or uses rule-based fallback
- ✅ No crash

---

## 📊 Impact

### Before Fix

- ❌ Infinite restart loop (Multilingual NER)
- ❌ Application crash (Dialogflow)
- ❌ High CPU usage from restart loop
- ❌ Logs flooded with errors

### After Fix

- ✅ Graceful fallback when services unavailable
- ✅ No crash loops
- ✅ Better error messages
- ✅ System continues to work with fallbacks

---

## 🎯 Next Steps

1. **Deploy updated code to Koyeb**
2. **Set environment variables:**
   - `ENABLE_MULTILINGUAL_NER=false` (if Python not available)
   - Remove invalid `GOOGLE_APPLICATION_CREDENTIALS`
3. **Monitor logs** for successful startup
4. **Verify** services work with fallbacks

---

**Status:** ✅ Fixed and ready for deployment

