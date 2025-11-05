// BEFORE: Mixed CQRS + Use Cases (confusing)
class JobController {
  constructor() {
    // Direct injection from DI container
  }

  async createJob(req, res) {
    // Controller calls use case directly
    const result = await createJobUseCase.execute(input);
  }
}

// AFTER: Clean Architecture with Use Cases (clear)
class JobController {
  constructor(createJobUseCase, getJobUseCase, updateJobUseCase) {
    this.createJobUseCase = createJobUseCase;
    this.getJobUseCase = getJobUseCase;
    this.updateJobUseCase = updateJobUseCase;
  }

  async createJob(req, res) {
    const result = await this.createJobUseCase.execute({
      employerId: req.user.employerId,
      jobData: req.body,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  }

  async getJob(req, res) {
    const result = await this.getJobUseCase.execute(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  }
}

// Use Case implementation
class CreateJobUseCase {
  constructor(jobRepository, employerRepository, validationService) {
    this.jobRepository = jobRepository;
    this.employerRepository = employerRepository;
    this.validationService = validationService;
  }

  async execute({ employerId, jobData }) {
    // 1. Validate employer exists
    const employer = await this.employerRepository.findById(employerId);
    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    // 2. Validate job data
    const validation = this.validationService.validateJob(jobData);
    if (!validation.isValid) {
      throw new ValidationException(validation.errors);
    }

    // 3. Create job
    const job = await this.jobRepository.create({
      ...jobData,
      employerId,
      status: 'draft',
    });

    return {
      job,
      message: 'Job created successfully',
    };
  }
}

// Repository Interface (Application Layer)
class IJobRepository {
  async create(jobData) {
    throw new Error('Not implemented');
  }
  async findById(id) {
    throw new Error('Not implemented');
  }
  async findAll(filter) {
    throw new Error('Not implemented');
  }
  async update(id, data) {
    throw new Error('Not implemented');
  }
  async delete(id) {
    throw new Error('Not implemented');
  }
}

// Repository Implementation (Infrastructure Layer)
class JobRepository extends IJobRepository {
  constructor(jobModel) {
    super();
    this.jobModel = jobModel;
  }

  async create(jobData) {
    const job = new this.jobModel(jobData);
    return await job.save();
  }

  async findById(id) {
    return await this.jobModel.findById(id);
  }

  // ... other methods
}

// DI Container
class DIContainer {
  constructor() {
    // Infrastructure
    this.jobModel = require('../models/Job');
    this.jobRepository = new JobRepository(this.jobModel);

    // Application
    this.createJobUseCase = new CreateJobUseCase(
      this.jobRepository,
      this.employerRepository,
      this.validationService
    );

    // Presentation
    this.jobController = new JobController(
      this.createJobUseCase,
      this.getJobUseCase,
      this.updateJobUseCase
    );
  }
}
