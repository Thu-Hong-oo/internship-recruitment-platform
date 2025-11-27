/**
 * Helper functions để tạo renderLayout cho templates
 */

/**
 * Tạo renderLayout mặc định cho two-column layout
 */
function createTwoColumnLayout(sections) {
  const leftColumnX = 48;
  const rightColumnX = 596;
  const leftColumnWidth = 520;
  const rightColumnWidth = 150;
  const startY = 48;
  const sectionSpacing = 20;

  let currentY = startY;
  const leftSections = [];
  const rightSections = [];
  let order = 1;

  // Map sections sang vị trí
  sections.forEach((sectionType) => {
    const sectionConfig = {
      type: sectionType,
      order: order++,
    };

    // Sections thường ở cột trái
    if (['personalInfo', 'careerObjective', 'objective', 'summary', 'experience', 'education', 'projects'].includes(sectionType)) {
      let height = 100; // Default height
      
      // Điều chỉnh height theo loại section
      if (sectionType === 'personalInfo') height = 140;
      else if (sectionType === 'careerObjective' || sectionType === 'objective' || sectionType === 'summary') height = 80;
      else if (sectionType === 'experience') height = 380;
      else if (sectionType === 'education') height = 180;
      else if (sectionType === 'projects') height = 200;

      leftSections.push({
        ...sectionConfig,
        x: leftColumnX,
        y: currentY,
        width: leftColumnWidth,
        height: height,
      });
      currentY += height + sectionSpacing;
    }
    // Sections thường ở cột phải
    else if (['skills', 'languages', 'certifications', 'awards', 'activities', 'hobbies', 'references'].includes(sectionType)) {
      let height = 150; // Default height
      
      if (sectionType === 'skills') height = 300;
      else if (sectionType === 'languages') height = 150;
      else if (sectionType === 'certifications') height = 200;

      rightSections.push({
        ...sectionConfig,
        x: rightColumnX,
        y: startY + (rightSections.length * 200), // Stack vertically
        width: rightColumnWidth,
        height: height,
      });
    }
  });

  return {
    page: {
      width: 794, // A4 width
      height: 1123, // A4 height
      padding: 24,
      backgroundColor: '#ffffff',
    },
    sections: [...leftSections, ...rightSections].sort((a, b) => a.order - b.order),
  };
}

/**
 * Tạo renderLayout mặc định cho single-column layout
 */
function createSingleColumnLayout(sections) {
  const columnX = 48;
  const columnWidth = 698; // Full width minus padding
  const startY = 48;
  const sectionSpacing = 20;

  let currentY = startY;
  const layoutSections = [];
  let order = 1;

  sections.forEach((sectionType) => {
    let height = 100; // Default height
    
    if (sectionType === 'personalInfo') height = 120;
    else if (sectionType === 'careerObjective' || sectionType === 'objective' || sectionType === 'summary') height = 80;
    else if (sectionType === 'experience') height = 300;
    else if (sectionType === 'education') height = 150;
    else if (sectionType === 'projects') height = 180;
    else if (sectionType === 'skills') height = 150;
    else if (sectionType === 'languages') height = 100;
    else if (sectionType === 'certifications') height = 150;

    layoutSections.push({
      type: sectionType,
      x: columnX,
      y: currentY,
      width: columnWidth,
      height: height,
      order: order++,
    });

    currentY += height + sectionSpacing;
  });

  return {
    page: {
      width: 794,
      height: 1123,
      padding: 24,
      backgroundColor: '#ffffff',
    },
    sections: layoutSections,
  };
}

/**
 * Tạo renderLayout tự động dựa trên template config
 */
function generateRenderLayout(template) {
  const layoutType = template.customization?.layout || 'two-column';
  const sections = template.sections || [];

  if (layoutType === 'single-column') {
    return createSingleColumnLayout(sections);
  } else {
    return createTwoColumnLayout(sections);
  }
}

module.exports = {
  createTwoColumnLayout,
  createSingleColumnLayout,
  generateRenderLayout,
};

