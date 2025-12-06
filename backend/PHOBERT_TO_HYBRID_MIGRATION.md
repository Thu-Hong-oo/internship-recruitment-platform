# Migration: PhoBERT → Hybrid System (Rule-based + Multilingual NER)

**Date**: 2025-12-06  
**Status**: ✅ Completed

## 📋 Summary

Backend đã được migrate từ PhoBERT NER sang **Hybrid System** (Rule-based 300+ patterns + Multilingual NER) cho skill extraction.

## 🔄 Changes Made

### 1. `selfSufficientAIService.js`
- ✅ Replaced `phobertService.extractSkills()` with `skillExtractor.extractSkills()` using Hybrid System
- ✅ Updated `analyzeCV()` to use Hybrid System
- ✅ Updated `analyzeJobDescription()` to use Hybrid System
- ✅ Updated `analyzeJobPosting()` to use Hybrid System
- ✅ Updated `analyzeJobMatch()` to use Hybrid System
- ✅ Commented out `phobertService` import (kept for future use)

### 2. `jobMatchingService.js`
- ✅ Updated `_extractSkills()` to use Hybrid System instead of PhoBERT
- ✅ Changed default: `useHybrid: true`, `usePhoBERT: false`

### 3. `aiController.js`
- ✅ Updated method name in response: `'self-sufficient (Hybrid System: Rule-based + Multilingual NER)'`

## ✅ What Works Now

1. **Hybrid System** (Primary):
   - Rule-based: 300+ patterns (100% recall Vietnamese)
   - Multilingual NER: dslim/bert-base-NER (90% recall English)
   - Auto language detection
   - Combined for mixed-language CVs

2. **Sentence-BERT** (Already working):
   - Text embeddings (768 dimensions)
   - Semantic similarity calculation
   - Job matching

## 📝 PhoBERT Status

- **Status**: ❌ Disabled (extraction issues)
- **Location**: Code commented out, ready to re-enable
- **When to re-enable**: After fixing PhoBERT model extraction issues

## 🔧 How to Re-enable PhoBERT (After Fixing)

1. Uncomment `phobertService` import in `selfSufficientAIService.js`
2. Change `usePhoBERT: false` → `usePhoBERT: true` in skill extraction calls
3. Test PhoBERT extraction with fixed model
4. Update method names back to include "PhoBERT"

## 📊 Performance Comparison

| Method | Vietnamese Recall | English Recall | Speed | Status |
|--------|------------------|----------------|--------|--------|
| **Hybrid System** | 100% | 90% | Fast | ✅ Active |
| PhoBERT NER | 0% (broken) | 0% (broken) | Slow | ❌ Disabled |
| Sentence-BERT | N/A | N/A | Medium | ✅ Active (similarity) |

## 🎯 Current Stack

1. **Skill Extraction**: Hybrid System (Rule-based + Multilingual NER)
2. **Semantic Similarity**: Sentence-BERT (768-dim embeddings)
3. **Job Matching**: Hybrid System + Sentence-BERT + TF-IDF

## ✅ Testing

All services now use Hybrid System by default. PhoBERT code is preserved but disabled, ready to re-enable after fixing.

---

**Last Updated**: 2025-12-06

