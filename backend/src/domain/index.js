// Domain Layer - Main Exports
// All domain modules and their exports

const Identity = require('./identity');
const Recruitment = require('./recruitment');
const MasterData = require('./master-data');
const NlpParsing = require('./nlp-parsing');
const AiMatching = require('./ai-matching');
const Learning = require('./learning');
const Supporting = require('./supporting');
const Notification = require('./notification');

module.exports = {
  Identity,
  Recruitment,
  MasterData,
  NlpParsing,
  AiMatching,
  Learning,
  Supporting,
  Notification
};