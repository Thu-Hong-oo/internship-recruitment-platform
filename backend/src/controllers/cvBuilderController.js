const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const ResumeBuilder = require('../models/ResumeBuilder');
const cvBuilderService = require('../services/resume/cvBuilderService');
const templateRenderer = require('../services/resume/templateRenderer');
const exportService = require('../services/resume/exportService');
const aiContentService = require('../services/resume/aiContentService');
const { logger } = require('../utils/logger');

/**
 * CV Builder Controller
 * Advanced CV creation and editing with AI assistance
 */

class CVBuilderController {
  // Create new CV
  createCV = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { templateId, title } = req.body;
    const userId = req.user.id;

    // Create new CV
    const cvData = {
      candidateId: userId,
      templateId: templateId || 'modern',
      content: {
        personalInfo: {},
        sections: []
      },
      customization: {
        colors: { primary: '#2563eb', secondary: '#64748b' },
        fonts: { heading: 'Inter', body: 'Inter' },
        layout: 'two-column'
      }
    };

    const cv = new ResumeBuilder(cvData);
    await cv.save();

    // Initialize with AI suggestions
    const aiSuggestions = await aiContentService.generateInitialSuggestions(userId);
    cv.aiGenerated.suggestions = aiSuggestions;
    await cv.save();

    res.status(201).json({
      success: true,
      data: cv,
      message: 'CV created successfully'
    });
  });

  // Get CV by ID
  getCV = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const cv = await ResumeBuilder.findOne({
      _id: id,
      candidateId: userId
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found'
      });
    }

    res.json({
      success: true,
      data: cv
    });
  });

  // Update CV content
  updateCV = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content, customization } = req.body;
    const userId = req.user.id;

    const cv = await ResumeBuilder.findOneAndUpdate(
      { _id: id, candidateId: userId },
      {
        content,
        customization,
        $push: {
          versions: {
            content,
            createdAt: new Date(),
            note: 'Auto-saved'
          }
        }
      },
      { new: true }
    );

    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found'
      });
    }

    res.json({
      success: true,
      data: cv,
      message: 'CV updated successfully'
    });
  });

  // Update specific section
  updateSection = asyncHandler(async (req, res) => {
    const { id, sectionId } = req.params;
    const { content, position, size } = req.body;
    const userId = req.user.id;

    const updateData = {
      $set: {
        [`content.sections.$[elem].content`]: content,
        [`content.sections.$[elem].position`]: position,
        [`content.sections.$[elem].size`]: size,
        updatedAt: new Date()
      }
    };

    const cv = await ResumeBuilder.findOneAndUpdate(
      { _id: id, candidateId: userId, 'content.sections.id': sectionId },
      updateData,
      {
        arrayFilters: [{ 'elem.id': sectionId }],
        new: true
      }
    );

    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV or section not found'
      });
    }

    res.json({
      success: true,
      data: cv,
      message: 'Section updated successfully'
    });
  });

  // Add new section
  addSection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type, title, content, position } = req.body;
    const userId = req.user.id;

    const sectionId = `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newSection = {
      id: sectionId,
      type,
      title,
      content: content || {},
      position: position || { x: 0, y: 0 },
      size: { width: 400, height: 200 }
    };

    const cv = await ResumeBuilder.findOneAndUpdate(
      { _id: id, candidateId: userId },
      {
        $push: { 'content.sections': newSection },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found'
      });
    }

    res.json({
      success: true,
      data: { section: newSection, cv },
      message: 'Section added successfully'
    });
  });

  // Delete section
  deleteSection = asyncHandler(async (req, res) => {
    const { id, sectionId } = req.params;
    const userId = req.user.id;

    const cv = await ResumeBuilder.findOneAndUpdate(
      { _id: id, candidateId: userId },
      {
        $pull: { 'content.sections': { id: sectionId } },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV or section not found'
      });
    }

    res.json({
      success: true,
      data: cv,
      message: 'Section deleted successfully'
    });
  });

  // Get AI suggestions for content
  getAISuggestions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { sectionType, currentContent, targetJob } = req.body;
    const userId = req.user.id;

    const cv = await ResumeBuilder.findOne({
      _id: id,
      candidateId: userId
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found'
      });
    }

    const suggestions = await aiContentService.generateSuggestions({
      sectionType,
      currentContent,
      targetJob,
      userProfile: cv.content.personalInfo,
      existingContent: cv.content
    });

    res.json({
      success: true,
      data: suggestions
    });
  });

  // Generate preview
  generatePreview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { format = 'html' } = req.query;
    const userId = req.user.id;

    const cv = await ResumeBuilder.findOne({
      _id: id,
      candidateId: userId
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found'
      });
    }

    const preview = await templateRenderer.render(cv, {
      format,
      isPreview: true
    });

    res.json({
      success: true,
      data: preview
    });
  });

  // Export CV
  exportCV = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { format = 'pdf', options = {} } = req.body;
    const userId = req.user.id;

    const cv = await ResumeBuilder.findOne({
      _id: id,
      candidateId: userId
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found'
      });
    }

    const exportResult = await exportService.export(cv, {
      format,
      ...options
    });

    // Save export record
    await ResumeBuilder.findByIdAndUpdate(id, {
      $push: {
        exports: {
          format,
          url: exportResult.url,
          generatedAt: new Date()
        }
      }
    });

    res.json({
      success: true,
      data: exportResult,
      message: `CV exported as ${format.toUpperCase()} successfully`
    });
  });

  // Get user's CVs list
  getUserCVs = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const cvs = await ResumeBuilder.find({ candidateId: userId })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('title templateId status updatedAt customization');

    const total = await ResumeBuilder.countDocuments({ candidateId: userId });

    res.json({
      success: true,
      data: {
        cvs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  });

  // Duplicate CV
  duplicateCV = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const originalCV = await ResumeBuilder.findOne({
      _id: id,
      candidateId: userId
    });

    if (!originalCV) {
      return res.status(404).json({
        success: false,
        error: 'CV not found'
      });
    }

    const duplicatedCV = new ResumeBuilder({
      ...originalCV.toObject(),
      _id: undefined,
      title: `${originalCV.title} (Copy)`,
      status: 'draft',
      versions: [],
      exports: [],
      createdAt: undefined,
      updatedAt: undefined
    });

    await duplicatedCV.save();

    res.json({
      success: true,
      data: duplicatedCV,
      message: 'CV duplicated successfully'
    });
  });

  // Optimize CV for job
  optimizeForJob = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { jobDescription, jobTitle } = req.body;
    const userId = req.user.id;

    const cv = await ResumeBuilder.findOne({
      _id: id,
      candidateId: userId
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found'
      });
    }

    const optimization = await aiContentService.optimizeForJob(cv, {
      jobDescription,
      jobTitle
    });

    res.json({
      success: true,
      data: optimization,
      message: 'CV optimization completed'
    });
  });
}

module.exports = new CVBuilderController();</content>
<parameter name="filePath">d:\KhoaLuan_Internship\internship-recruitment-platform\backend\src\controllers\cvBuilderController.js