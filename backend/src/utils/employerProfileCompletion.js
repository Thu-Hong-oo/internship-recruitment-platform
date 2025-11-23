/**
 * Employer Profile Completion Utility
 * Tính toán tiến độ hoàn thiện profile của employer
 * Giúp FE biết thông tin nào đã có, thông tin nào chưa có
 */

/**
 * Tính toán profile completion cho employer
 * @param {Object} profile - EmployerProfile object
 * @param {Object} user - User object (optional, để check fullName, avatar)
 * @returns {Object} Completion info với percentage và missing fields
 */
function calculateEmployerProfileCompletion(profile, user = null) {
  const sections = {
    // User info (từ User model)
    userInfo: {
      weight: 10,
      fields: {
        fullName: user?.fullName,
        avatar: user?.avatar,
      },
      required: ['fullName'],
      optional: ['avatar'],
    },

    // Company basic info
    company: {
      weight: 25,
      fields: {
        name: profile?.company?.name,
        industry: profile?.company?.industry,
        description: profile?.company?.description,
        website: profile?.company?.website,
        logo: profile?.company?.logo?.url,
        coverImage: profile?.company?.coverImage?.url,
      },
      required: ['name', 'industry'],
      optional: ['description', 'website', 'logo', 'coverImage'],
    },

    // Business info (đăng ký kinh doanh)
    businessInfo: {
      weight: 20,
      fields: {
        registrationNumber: profile?.businessInfo?.registrationNumber,
        taxId: profile?.businessInfo?.taxId,
        issueDate: profile?.businessInfo?.issueDate,
        issuePlace: profile?.businessInfo?.issuePlace,
        address: profile?.businessInfo?.address,
      },
      required: ['registrationNumber', 'taxId'],
      optional: ['issueDate', 'issuePlace', 'address'],
    },

    // Legal representative
    legalRepresentative: {
      weight: 15,
      fields: {
        fullName: profile?.legalRepresentative?.fullName,
        position: profile?.legalRepresentative?.position,
        phone: profile?.legalRepresentative?.phone,
        email: profile?.legalRepresentative?.email,
      },
      required: ['fullName', 'position'],
      optional: ['phone', 'email'],
    },

    // Contact info
    contact: {
      weight: 10,
      fields: {
        phone: profile?.contact?.phone,
        email: profile?.contact?.email,
        address: profile?.contact?.address,
      },
      required: ['phone', 'email'],
      optional: ['address'],
    },

    // Position (vị trí của employer trong công ty)
    position: {
      weight: 5,
      fields: {
        position: profile?.position,
      },
      required: ['position'],
      optional: [],
    },

    // Documents (giấy tờ xác thực)
    documents: {
      weight: 15,
      fields: {
        businessLicense: profile?.verification?.documents?.some(
          doc => doc.documentType === 'business-license' && doc.verified
        ),
        taxCertificate: profile?.verification?.documents?.some(
          doc => doc.documentType === 'tax-certificate' && doc.verified
        ),
      },
      required: ['businessLicense', 'taxCertificate'],
      optional: [],
    },
  };

  let totalScore = 0;
  let maxScore = 0;
  const missingFields = {};
  const completedFields = {};
  const sectionStatus = {};

  for (const [sectionName, section] of Object.entries(sections)) {
    maxScore += section.weight;
    const sectionData = section.fields;
    const sectionMissing = [];
    const sectionCompleted = [];
    let sectionScore = 0;

    // Check required fields
    for (const field of section.required) {
      const value = sectionData[field];
      const isComplete = value !== undefined && value !== null && value !== '';

      if (isComplete) {
        sectionCompleted.push(field);
        sectionScore += section.weight / section.required.length;
      } else {
        sectionMissing.push(field);
      }
    }

    // Check optional fields (bonus points)
    const optionalCount = section.optional.length;
    if (optionalCount > 0) {
      const completedOptional = section.optional.filter(
        field =>
          sectionData[field] !== undefined &&
          sectionData[field] !== null &&
          sectionData[field] !== ''
      ).length;
      // Optional fields contribute 20% of section weight
      sectionScore +=
        section.weight * 0.2 * (completedOptional / optionalCount);
    }

    totalScore += sectionScore;

    if (sectionMissing.length > 0) {
      missingFields[sectionName] = sectionMissing;
    }
    if (sectionCompleted.length > 0) {
      completedFields[sectionName] = sectionCompleted;
    }

    sectionStatus[sectionName] = {
      completed: sectionCompleted.length,
      required: section.required.length,
      optional: section.optional.length,
      completedOptional: section.optional.filter(
        field =>
          sectionData[field] !== undefined &&
          sectionData[field] !== null &&
          sectionData[field] !== ''
      ).length,
      isComplete: sectionMissing.length === 0,
      percentage:
        section.required.length > 0
          ? Math.round(
              (sectionCompleted.length / section.required.length) * 100
            )
          : 100,
    };
  }

  // Calculate percentage, cap at 100% (optional fields are bonus but shouldn't exceed 100%)
  const rawPercentage = (totalScore / maxScore) * 100;
  const percentage = Math.min(100, Math.round(rawPercentage));

  // Determine priority missing fields (most important first)
  const priorityMissing = [];

  // Priority 1: User info (fullName)
  if (missingFields.userInfo?.includes('fullName')) {
    priorityMissing.push({
      section: 'userInfo',
      field: 'fullName',
      label: 'Họ và tên',
      priority: 1,
      endpoint: 'PUT /api/users/profile',
      description: 'Cập nhật họ và tên của bạn',
    });
  }

  // Priority 2: Company name
  if (missingFields.company?.includes('name')) {
    priorityMissing.push({
      section: 'company',
      field: 'name',
      label: 'Tên công ty',
      priority: 2,
      endpoint: 'PUT /api/employers/company',
      description: 'Nhập tên công ty của bạn',
    });
  }

  // Priority 3: Business info
  if (missingFields.businessInfo?.length > 0) {
    priorityMissing.push({
      section: 'businessInfo',
      fields: missingFields.businessInfo,
      label: 'Thông tin đăng ký kinh doanh',
      priority: 3,
      endpoint: 'PUT /api/employers/company',
      description: 'Cập nhật số ĐKKD và MST',
    });
  }

  // Priority 4: Legal representative
  if (missingFields.legalRepresentative?.length > 0) {
    priorityMissing.push({
      section: 'legalRepresentative',
      fields: missingFields.legalRepresentative,
      label: 'Người đại diện pháp luật',
      priority: 4,
      endpoint: 'PUT /api/employers/company',
      description: 'Cập nhật thông tin người đại diện pháp luật',
    });
  }

  // Priority 5: Documents
  if (missingFields.documents?.length > 0) {
    priorityMissing.push({
      section: 'documents',
      fields: missingFields.documents,
      label: 'Giấy tờ xác thực',
      priority: 5,
      endpoint: 'POST /api/employers/documents',
      description:
        'Upload giấy phép kinh doanh và giấy chứng nhận đăng ký thuế',
    });
  }

  // Nhóm theo 3 phần chính cho FE (theo thứ tự: 1. Thông tin cá nhân, 2. Tài liệu, 3. Thông tin công ty)
  const sectionsGrouped = {
    personalInfo: {
      label: 'Thông tin cá nhân',
      weight: 25, // userInfo (10%) + position (5%) + contact (10%)
      sections: ['userInfo', 'position', 'contact'],
      isComplete: ['userInfo', 'position', 'contact'].every(
        s => sectionStatus[s]?.isComplete
      ),
      percentage: Math.round(
        ['userInfo', 'position', 'contact'].reduce(
          (sum, s) => sum + (sectionStatus[s]?.percentage || 0),
          0
        ) / 3
      ),
      missingFields: ['userInfo', 'position', 'contact']
        .flatMap(s => missingFields[s] || [])
        .filter(Boolean),
      completedFields: ['userInfo', 'position', 'contact']
        .flatMap(s => completedFields[s] || [])
        .filter(Boolean),
      priority: 1,
      endpoint: 'PUT /api/employers/profile',
      description:
        'Cập nhật thông tin cá nhân: họ tên, avatar, vị trí, liên hệ',
    },
    companyInfo: {
      label: 'Thông tin công ty',
      weight: 60, // company (25%) + businessInfo (20%) + legalRepresentative (15%)
      sections: ['company', 'businessInfo', 'legalRepresentative'],
      isComplete: ['company', 'businessInfo', 'legalRepresentative'].every(
        s => sectionStatus[s]?.isComplete
      ),
      percentage: Math.round(
        ['company', 'businessInfo', 'legalRepresentative'].reduce(
          (sum, s) => sum + (sectionStatus[s]?.percentage || 0),
          0
        ) / 3
      ),
      missingFields: ['company', 'businessInfo', 'legalRepresentative']
        .flatMap(s => missingFields[s] || [])
        .filter(Boolean),
      completedFields: ['company', 'businessInfo', 'legalRepresentative']
        .flatMap(s => completedFields[s] || [])
        .filter(Boolean),
      priority: 2,
      endpoint: 'PUT /api/employers/company',
      description:
        'Cập nhật thông tin công ty: tên công ty, đăng ký kinh doanh, người đại diện pháp luật, logo, ảnh bìa',
    },
    documents: {
      label: 'Tài liệu',
      weight: 15, // documents (15%)
      sections: ['documents'],
      isComplete: sectionStatus.documents?.isComplete || false,
      percentage: sectionStatus.documents?.percentage || 0,
      missingFields: missingFields.documents || [],
      completedFields: completedFields.documents || [],
      priority: 3,
      endpoint: 'POST /api/employers/documents',
      description:
        'Upload giấy phép kinh doanh và giấy chứng nhận đăng ký thuế',
    },
  };

  // Tính percentage cho từng phần
  const personalInfoScore = ['userInfo', 'position', 'contact'].reduce(
    (sum, s) => {
      const section = sections[s];
      const status = sectionStatus[s];
      if (!status) return sum;
      const sectionMax = section.weight;
      const sectionCurrent = (status.completed / status.required) * sectionMax;
      return sum + sectionCurrent;
    },
    0
  );
  const personalInfoMax = ['userInfo', 'position', 'contact'].reduce(
    (sum, s) => sum + sections[s].weight,
    0
  );

  const companyInfoScore = [
    'company',
    'businessInfo',
    'legalRepresentative',
  ].reduce((sum, s) => {
    const section = sections[s];
    const status = sectionStatus[s];
    if (!status) return sum;
    const sectionMax = section.weight;
    const sectionCurrent = (status.completed / status.required) * sectionMax;
    return sum + sectionCurrent;
  }, 0);
  const companyInfoMax = [
    'company',
    'businessInfo',
    'legalRepresentative',
  ].reduce((sum, s) => sum + sections[s].weight, 0);

  const documentsScore = (() => {
    const section = sections.documents;
    const status = sectionStatus.documents;
    if (!status) return 0;
    return (status.completed / status.required) * section.weight;
  })();
  const documentsMax = sections.documents.weight;

  sectionsGrouped.personalInfo.percentage = Math.round(
    (personalInfoScore / personalInfoMax) * 100
  );
  sectionsGrouped.companyInfo.percentage = Math.round(
    (companyInfoScore / companyInfoMax) * 100
  );
  sectionsGrouped.documents.percentage = Math.round(
    (documentsScore / documentsMax) * 100
  );

  return {
    percentage,
    score: Math.min(totalScore, maxScore), // Cap score at maxScore
    maxScore,
    rawScore: totalScore, // Include raw score for reference (includes bonus from optional fields)
    isComplete: percentage >= 80, // 80% được coi là hoàn thiện
    missingFields,
    completedFields,
    sectionStatus,
    priorityMissing, // Các field quan trọng nhất cần cập nhật
    // ✅ Thêm sectionsGrouped để FE biết phần nào đã complete
    sections: sectionsGrouped,
    summary: {
      totalSections: Object.keys(sections).length,
      completedSections: Object.values(sectionStatus).filter(s => s.isComplete)
        .length,
      missingSections: Object.keys(missingFields).length,
      // Thêm summary cho 3 phần chính (theo thứ tự: 1. Thông tin cá nhân, 2. Tài liệu, 3. Thông tin công ty)
      personalInfo: {
        isComplete: sectionsGrouped.personalInfo.isComplete,
        percentage: sectionsGrouped.personalInfo.percentage,
      },
      documents: {
        isComplete: sectionsGrouped.documents.isComplete,
        percentage: sectionsGrouped.documents.percentage,
      },
      companyInfo: {
        isComplete: sectionsGrouped.companyInfo.isComplete,
        percentage: sectionsGrouped.companyInfo.percentage,
      },
    },
  };
}

module.exports = {
  calculateEmployerProfileCompletion,
};
