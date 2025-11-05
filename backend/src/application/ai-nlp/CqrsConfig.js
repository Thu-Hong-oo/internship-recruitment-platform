/**
 * CQRS Configuration for AI/NLP Domain
 * Application Layer - AI/NLP Domain
 * Registers commands, queries, and their handlers
 */
const MatchCandidateToJobCommand = require('./commands/MatchCandidateToJobCommand');
const MatchCandidateToJobCommandHandler = require('./handlers/MatchCandidateToJobCommandHandler');

const GetMatchingHistoryQuery = require('./queries/GetMatchingHistoryQuery');
const GetMatchingHistoryQueryHandler = require('./handlers/GetMatchingHistoryQueryHandler');

class AiNlpCqrsConfig {
  constructor(props) {
    this.aiMatchingService = props.aiMatchingService;
    this.candidateRepository = props.candidateRepository;
    this.jobRepository = props.jobRepository;
    this.aiMatchingRepository = props.aiMatchingRepository;
  }

  getCommandHandlers() {
    return {
      [MatchCandidateToJobCommand.name]: new MatchCandidateToJobCommandHandler({
        aiMatchingService: this.aiMatchingService,
        candidateRepository: this.candidateRepository,
        jobRepository: this.jobRepository,
      }),
    };
  }

  getQueryHandlers() {
    return {
      [GetMatchingHistoryQuery.name]: new GetMatchingHistoryQueryHandler({
        aiMatchingRepository: this.aiMatchingRepository,
      }),
    };
  }

  getEventHandlers() {
    return {
      // Event handlers will be added here as needed
    };
  }
}

module.exports = AiNlpCqrsConfig;
