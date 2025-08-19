const mongoose = require('mongoose');

const RawJobSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // unique per source + externalId
    source: { type: String, required: true },
    url: { type: String },
    payload: { type: Object, required: true }, // raw scraped data
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

RawJobSchema.index({ source: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('RawJob', RawJobSchema);



