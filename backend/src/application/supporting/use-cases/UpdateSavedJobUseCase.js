/**
 * Update Saved Job Use Case
 * Updates metadata for a saved job (notes, tags, priority, folder)
 */

class UpdateSavedJobUseCase {
  constructor(savedJobRepository) {
    this.savedJobRepository = savedJobRepository;
  }

  async execute(candidateId, savedJobId, updateData) {
    try {
      // Find the saved job
      const savedJob = await this.savedJobRepository.findById(savedJobId);
      if (!savedJob) {
        throw new Error('Saved job not found');
      }

      // Verify ownership
      if (savedJob.candidateId !== candidateId) {
        throw new Error('Access denied');
      }

      // Validate update data
      const validation = this._validateUpdateData(updateData);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Prepare update fields
      const updateFields = {
        updatedAt: new Date(),
      };

      // Update allowed fields
      if (updateData.notes !== undefined) {
        updateFields.notes = updateData.notes;
      }

      if (updateData.tags !== undefined) {
        updateFields.tags = Array.isArray(updateData.tags)
          ? updateData.tags
          : [];
      }

      if (updateData.priority !== undefined) {
        updateFields.priority = updateData.priority;
      }

      if (updateData.folder !== undefined) {
        updateFields.folder = updateData.folder || 'default';
      }

      if (updateData.reminderDate !== undefined) {
        updateFields.reminderDate = updateData.reminderDate
          ? new Date(updateData.reminderDate)
          : null;
      }

      // Update the saved job
      const updatedSavedJob = await this.savedJobRepository.update(
        savedJobId,
        updateFields
      );

      return {
        success: true,
        data: updatedSavedJob,
        message: 'Saved job updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _validateUpdateData(updateData) {
    // Priority validation
    if (updateData.priority !== undefined) {
      const validPriorities = ['low', 'normal', 'high'];
      if (!validPriorities.includes(updateData.priority)) {
        return {
          isValid: false,
          message: 'Invalid priority. Must be low, normal, or high',
        };
      }
    }

    // Notes validation
    if (
      updateData.notes !== undefined &&
      typeof updateData.notes !== 'string'
    ) {
      return { isValid: false, message: 'Notes must be a string' };
    }

    if (updateData.notes && updateData.notes.length > 1000) {
      return { isValid: false, message: 'Notes cannot exceed 1000 characters' };
    }

    // Tags validation
    if (updateData.tags !== undefined) {
      if (!Array.isArray(updateData.tags)) {
        return { isValid: false, message: 'Tags must be an array' };
      }

      if (updateData.tags.length > 10) {
        return { isValid: false, message: 'Cannot have more than 10 tags' };
      }

      // Validate each tag
      for (const tag of updateData.tags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          return {
            isValid: false,
            message: 'All tags must be non-empty strings',
          };
        }
        if (tag.length > 50) {
          return {
            isValid: false,
            message: 'Each tag cannot exceed 50 characters',
          };
        }
      }
    }

    // Folder validation
    if (updateData.folder !== undefined) {
      if (updateData.folder && typeof updateData.folder !== 'string') {
        return { isValid: false, message: 'Folder must be a string' };
      }
      if (updateData.folder && updateData.folder.length > 100) {
        return {
          isValid: false,
          message: 'Folder name cannot exceed 100 characters',
        };
      }
    }

    // Reminder date validation
    if (
      updateData.reminderDate !== undefined &&
      updateData.reminderDate !== null
    ) {
      const reminderDate = new Date(updateData.reminderDate);
      if (isNaN(reminderDate.getTime())) {
        return { isValid: false, message: 'Invalid reminder date format' };
      }
      if (reminderDate < new Date()) {
        return {
          isValid: false,
          message: 'Reminder date cannot be in the past',
        };
      }
    }

    return { isValid: true };
  }
}

module.exports = UpdateSavedJobUseCase;
