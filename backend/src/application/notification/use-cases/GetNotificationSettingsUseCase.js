/**
 * Get Notification Settings Use Case
 * Retrieves notification preferences for a user
 */

class GetNotificationSettingsUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's notification settings or return defaults
      const settings = user.notificationSettings || this._getDefaultSettings();

      return {
        success: true,
        data: {
          settings,
          lastUpdated: user.notificationSettingsUpdatedAt || user.createdAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
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
        digest: 'weekly', // daily, weekly, monthly, never
        jobMatches: 'immediate', // immediate, daily, weekly
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

module.exports = GetNotificationSettingsUseCase;
