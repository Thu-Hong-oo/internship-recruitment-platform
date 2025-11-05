const {
  jobRepository,
  employerRepository,
  companyRepository,
  validationService,
} = require('../../infrastructure/config/diContainer');

// Import service functions
const createJobFn = require('./services/createjob');
const getJobFn = require('./services/getjob');
const getAllJobsFn = require('./services/getalljobs');
const updateJobFn = require('./services/updatejob');
const deleteJobFn = require('./services/deletejob');

// Create service with dependencies injected
const createJob = createJobFn({
  jobRepository,
  employerRepository,
  companyRepository,
  validationService,
});
const getJob = getJobFn({ jobRepository });
const getAllJobs = getAllJobsFn({ jobRepository });
const updateJob = updateJobFn({ jobRepository, validationService });
const deleteJob = deleteJobFn({ jobRepository });

module.exports = {
  create: createJob,
  get: getJob,
  getAll: getAllJobs,
  update: updateJob,
  delete: deleteJob,
};
