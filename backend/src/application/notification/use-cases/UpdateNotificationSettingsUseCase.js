/**
 * Update Notification Settings Use Case
 * Updates notification preferences for a user
 */

class UpdateNotificationSettingsUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, settingsUpdate) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate settings
      const validation = this._validateSettings(settingsUpdate);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Get current settings or defaults
      const currentSettings =
        user.notificationSettings || this._getDefaultSettings();

      // Merge new settings with current settings
      const updatedSettings = this._mergeSettings(
        currentSettings,
        settingsUpdate
      );

      // Update user record
      const updateData = {
        notificationSettings: updatedSettings,
        notificationSettingsUpdatedAt: new Date(),
        updatedAt: new Date(),
      };

      await this.userRepository.update(userId, updateData);

      return {
        success: true,
        data: {
          settings: updatedSettings,
        },
        message: 'Notification settings updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _validateSettings(settings) {
    // Validate frequency values
    if (settings.frequency) {
      const validDigestFrequencies = ['daily', 'weekly', 'monthly', 'never'];
      const validJobMatchFrequencies = ['immediate', 'daily', 'weekly'];

      if (
        settings.frequency.digest &&
        !validDigestFrequencies.includes(settings.frequency.digest)
      ) {
        return { isValid: false, message: 'Invalid digest frequency' };
      }

      if (
        settings.frequency.jobMatches &&
        !validJobMatchFrequencies.includes(settings.frequency.jobMatches)
      ) {
        return { isValid: false, message: 'Invalid job matches frequency' };
      }
    }

    // Validate quiet hours
    if (settings.quietHours) {
      if (
        settings.quietHours.startTime &&
        !this._isValidTime(settings.quietHours.startTime)
      ) {
        return {
          isValid: false,
          message: 'Invalid start time format (use HH:mm)',
        };
      }

      if (
        settings.quietHours.endTime &&
        !this._isValidTime(settings.quietHours.endTime)
      ) {
        return {
          isValid: false,
          message: 'Invalid end time format (use HH:mm)',
        };
      }
    }

    return { isValid: true };
  }

  _isValidTime(timeString) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  _mergeSettings(currentSettings, updates) {
    const merged = { ...currentSettings };

    // Deep merge each section
    Object.keys(updates).forEach(key => {
      if (
        typeof updates[key] === 'object' &&
        !Array.isArray(updates[key]) &&
        updates[key] !== null
      ) {
        merged[key] = {
          ...merged[key],
          ...updates[key],
        };
      } else {
        merged[key] = updates[key];
      }
    });

    return merged;
  }

  _getDefaultSettings() {
    return {
      emailNotifications: {
        applicationUpdates: true,
        jobMatches: true,
        messages: true,
        interviewReminders: true,
        systemAnnouncements: false,
        marketingEmails: false,
        weeklyDigest: true,
      },
      pushNotifications: {
        applicationUpdates: true,
        jobMatches: true,
        messages: true,
        interviewReminders: true,
        systemAnnouncements: true,
        inAppOnly: false,
      },
      smsNotifications: {
        enabled: false,
        interviewReminders: false,
        urgentUpdates: false,
      },
      frequency: {
        digest: 'weekly',
        jobMatches: 'immediate',
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC',
      },
      categories: {
        applications: true,
        jobs: true,
        messages: true,
        learning: true,
        system: true,
      },
    };
  }
}

module.exports = UpdateNotificationSettingsUseCase;
