const mongoose = require('mongoose');
const EmployerProfile = require('../models/EmployerProfile');
const { DOCUMENT_TYPES } = require('../config/documentTypes');

// Migration script to update existing documents with new type validation
const migrateDocumentTypes = async () => {
  try {
    console.log('Starting document types migration...');

    // Get all employer profiles with documents
    const profiles = await EmployerProfile.find({
      'verification.documents': { $exists: true, $not: { $size: 0 } },
    });

    console.log(`Found ${profiles.length} profiles with documents`);

    let updatedCount = 0;

    for (const profile of profiles) {
      let needsUpdate = false;

      // Check each document and update if needed
      for (const doc of profile.verification.documents) {
        // Validate document type against new configuration
        const isValidType = Object.values(DOCUMENT_TYPES)
          .flat()
          .some(type => type.id === doc.type);

        if (!isValidType) {
          console.log(
            `Invalid document type found: ${doc.type} in profile ${profile._id}`
          );

          // Map old types to new types if possible
          const typeMapping = {
            'company-registration': 'business-license',
            'business-registration': 'business-license',
            'tax-registration': 'tax-certificate',
            'representative-id': 'legal-representative-id',
            'company-logo': 'company-logo',
            'website-screenshot': 'company-website-screenshot',
          };

          if (typeMapping[doc.type]) {
            doc.type = typeMapping[doc.type];
            needsUpdate = true;
            console.log(`Mapped ${doc.type} to ${typeMapping[doc.type]}`);
          } else {
            // Remove invalid document
            profile.verification.documents =
              profile.verification.documents.filter(
                d => d._id.toString() !== doc._id.toString()
              );
            needsUpdate = true;
            console.log(`Removed invalid document type: ${doc.type}`);
          }
        }
      }

      if (needsUpdate) {
        await profile.save();
        updatedCount++;
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} profiles.`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  mongoose
    .connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/internship-platform'
    )
    .then(() => {
      console.log('Connected to MongoDB');
      return migrateDocumentTypes();
    })
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateDocumentTypes };
