// Central export for all constants
const authConstants = require('./auth.constants');
const commonConstants = require('./common.constants');
const jobConstants = require('./job.constants');
const notificationConstants = require('./notification.constants');
const systemConstants = require('./system.constants');
const userConstants = require('./user.constants');

module.exports = {
  ...authConstants,
  ...commonConstants,
  ...jobConstants,
  ...notificationConstants,
  ...systemConstants,
  ...userConstants,
};
