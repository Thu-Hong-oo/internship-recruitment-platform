/**
 * Curated Resources Database Extensions
 * 
 * Additional curated resources for specialized skills:
 * - UI/UX Design (Figma, Adobe XD, Sketch, Design Systems)
 * - Frontend Frameworks (React, Vue, Angular)
 * - Backend Frameworks (Express, Django, Flask)
 * - And more...
 * 
 * This file extends curatedResourcesDatabase with more skills
 */

const additionalResources = {
  // UI/UX Design Tools - HIGH DEMAND
  'figma': {
    course: [
      {
        title: 'Figma UI UX Design Essentials',
        url: 'https://www.udemy.com/course/figma-ux-ui-design-user-experience-tutorial-course/',
        provider: 'Udemy',
        instructor: 'Daniel Walter Scott',
        rating: 4.8,
        students: 50000,
        duration: '12 hours',
        difficulty: 'beginner',
        isFree: false,
        estimatedCost: 19.99,
        certificateOffered: true,
      },
      {
        title: 'Complete Web & Mobile Designer: UI/UX, Figma, +more',
        url: 'https://www.udemy.com/course/complete-web-designer-mobile-designer-zero-to-mastery/',
        provider: 'Udemy',
        instructor: 'Andrei Neagoie, Daniel Schifano',
        rating: 4.7,
        students: 80000,
        duration: '24 hours',
        difficulty: 'intermediate',
        isFree: false,
        estimatedCost: 19.99,
        certificateOffered: true,
      },
    ],
    video: [
      {
        title: 'Figma Tutorial for UI Design - Course for Beginners',
        url: 'https://www.youtube.com/watch?v=jwCmIBJ8Jtc',
        provider: 'YouTube - freeCodeCamp.org',
        channel: 'freeCodeCamp.org',
        views: 500000,
        duration: '2 hours',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.9,
      },
      {
        title: 'Figma in 40 Minutes',
        url: 'https://www.youtube.com/watch?v=4W4LvJnNegP',
        provider: 'YouTube - DesignCourse',
        channel: 'DesignCourse',
        views: 800000,
        duration: '40 minutes',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.8,
      },
      {
        title: 'Figma Master Class for Beginners (2024)',
        url: 'https://www.youtube.com/watch?v=II-6dDzc-80',
        provider: 'YouTube - Flux',
        channel: 'Flux',
        views: 300000,
        duration: '3 hours',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.7,
      },
    ],
    documentation: [
      {
        title: 'Figma Help Center',
        url: 'https://help.figma.com/',
        provider: 'Figma',
        difficulty: 'beginner',
        isFree: true,
        rating: 5.0,
      },
      {
        title: 'Figma Best Practices',
        url: 'https://www.figma.com/best-practices/',
        provider: 'Figma',
        difficulty: 'intermediate',
        isFree: true,
        rating: 4.8,
      },
    ],
  },

  'adobe xd': {
    course: [
      {
        title: 'Adobe XD for Beginners',
        url: 'https://www.udemy.com/course/adobe-xd-for-beginners/',
        provider: 'Udemy',
        instructor: 'Pablo Stanley',
        rating: 4.6,
        students: 25000,
        duration: '6 hours',
        difficulty: 'beginner',
        isFree: false,
        estimatedCost: 19.99,
        certificateOffered: true,
      },
      {
        title: 'User Experience Design Essentials - Adobe XD UI UX Design',
        url: 'https://www.udemy.com/course/ui-ux-web-design-using-adobe-xd/',
        provider: 'Udemy',
        instructor: 'Daniel Walter Scott',
        rating: 4.7,
        students: 40000,
        duration: '11 hours',
        difficulty: 'beginner',
        isFree: false,
        estimatedCost: 19.99,
        certificateOffered: true,
      },
    ],
    video: [
      {
        title: 'Adobe XD Tutorial: User Experience Design Course',
        url: 'https://www.youtube.com/watch?v=68w2VwalD5w',
        provider: 'YouTube - Bring Your Own Laptop',
        channel: 'Bring Your Own Laptop',
        views: 400000,
        duration: '2.5 hours',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.7,
      },
      {
        title: 'Adobe XD Crash Course',
        url: 'https://www.youtube.com/watch?v=3rQ-eTmWah0',
        provider: 'YouTube - Traversy Media',
        channel: 'Traversy Media',
        views: 500000,
        duration: '1 hour',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.8,
      },
    ],
    documentation: [
      {
        title: 'Adobe XD User Guide',
        url: 'https://helpx.adobe.com/xd/user-guide.html',
        provider: 'Adobe',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.8,
      },
    ],
  },

  'sketch': {
    course: [
      {
        title: 'Sketch from A to Z (2024): Become an App Designer',
        url: 'https://www.udemy.com/course/sketch-design/',
        provider: 'Udemy',
        instructor: 'Joseph Angelo Todaro',
        rating: 4.7,
        students: 35000,
        duration: '10 hours',
        difficulty: 'beginner',
        isFree: false,
        estimatedCost: 19.99,
        certificateOffered: true,
      },
    ],
    video: [
      {
        title: 'Sketch App Tutorial for Beginners',
        url: 'https://www.youtube.com/watch?v=AV2OkzIGykA',
        provider: 'YouTube - DesignCourse',
        channel: 'DesignCourse',
        views: 300000,
        duration: '1 hour',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.7,
      },
      {
        title: 'Sketch App Crash Course',
        url: 'https://www.youtube.com/watch?v=ilcwjXTqyNM',
        provider: 'YouTube - DesignCourse',
        channel: 'DesignCourse',
        views: 250000,
        duration: '45 minutes',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.6,
      },
    ],
    documentation: [
      {
        title: 'Sketch Official Documentation',
        url: 'https://www.sketch.com/docs/',
        provider: 'Sketch',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.9,
      },
    ],
  },

  'design systems': {
    course: [
      {
        title: 'Design Systems with Brad Frost',
        url: 'https://www.udemy.com/course/design-systems-101/',
        provider: 'Udemy',
        instructor: 'Brad Frost',
        rating: 4.8,
        students: 15000,
        duration: '8 hours',
        difficulty: 'intermediate',
        isFree: false,
        estimatedCost: 29.99,
        certificateOffered: true,
      },
      {
        title: 'Creating Design Systems in Figma',
        url: 'https://www.udemy.com/course/creating-design-systems/',
        provider: 'Udemy',
        instructor: 'Gary Simon',
        rating: 4.7,
        students: 20000,
        duration: '6 hours',
        difficulty: 'intermediate',
        isFree: false,
        estimatedCost: 19.99,
        certificateOffered: true,
      },
    ],
    video: [
      {
        title: 'Design Systems Crash Course',
        url: 'https://www.youtube.com/watch?v=wc5krC28ynQ',
        provider: 'YouTube - DesignCourse',
        channel: 'DesignCourse',
        views: 200000,
        duration: '45 minutes',
        difficulty: 'intermediate',
        isFree: true,
        rating: 4.8,
      },
      {
        title: 'Building Design Systems in Figma',
        url: 'https://www.youtube.com/watch?v=EK-pHkc5EL4',
        provider: 'YouTube - Figma',
        channel: 'Figma',
        views: 150000,
        duration: '1 hour',
        difficulty: 'intermediate',
        isFree: true,
        rating: 4.7,
      },
    ],
    documentation: [
      {
        title: 'Design Systems Handbook',
        url: 'https://www.designbetter.co/design-systems-handbook',
        provider: 'DesignBetter.co',
        difficulty: 'intermediate',
        isFree: true,
        rating: 4.9,
      },
      {
        title: 'Material Design System',
        url: 'https://m3.material.io/',
        provider: 'Google',
        difficulty: 'intermediate',
        isFree: true,
        rating: 4.8,
      },
    ],
  },

  // Frontend Frameworks
  'react': {
    course: [
      {
        title: 'React - The Complete Guide 2024 (incl. React Router & Redux)',
        url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
        provider: 'Udemy',
        instructor: 'Maximilian Schwarzmüller',
        rating: 4.8,
        students: 500000,
        duration: '50 hours',
        difficulty: 'beginner',
        isFree: false,
        estimatedCost: 19.99,
        certificateOffered: true,
      },
    ],
    video: [
      {
        title: 'React Course - Beginner\'s Tutorial for React JavaScript Library',
        url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
        provider: 'YouTube - freeCodeCamp.org',
        channel: 'freeCodeCamp.org',
        views: 8000000,
        duration: '12 hours',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.9,
      },
    ],
    documentation: [
      {
        title: 'React Official Documentation',
        url: 'https://react.dev/',
        provider: 'Meta',
        difficulty: 'intermediate',
        isFree: true,
        rating: 5.0,
      },
    ],
  },

  'vue': {
    course: [
      {
        title: 'Vue - The Complete Guide (incl. Router & Composition API)',
        url: 'https://www.udemy.com/course/vuejs-2-the-complete-guide/',
        provider: 'Udemy',
        instructor: 'Maximilian Schwarzmüller',
        rating: 4.7,
        students: 200000,
        duration: '32 hours',
        difficulty: 'beginner',
        isFree: false,
        estimatedCost: 19.99,
        certificateOffered: true,
      },
    ],
    video: [
      {
        title: 'Vue.js Course for Beginners',
        url: 'https://www.youtube.com/watch?v=FXpIoQ_rT_c',
        provider: 'YouTube - freeCodeCamp.org',
        channel: 'freeCodeCamp.org',
        views: 2000000,
        duration: '3 hours',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.8,
      },
    ],
    documentation: [
      {
        title: 'Vue.js Official Documentation',
        url: 'https://vuejs.org/',
        provider: 'Vue.js Core Team',
        difficulty: 'intermediate',
        isFree: true,
        rating: 5.0,
      },
    ],
  },

  // Backend Frameworks
  'express': {
    course: [
      {
        title: 'Node.js, Express, MongoDB & More: The Complete Bootcamp',
        url: 'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/',
        provider: 'Udemy',
        instructor: 'Jonas Schmedtmann',
        rating: 4.8,
        students: 150000,
        duration: '40 hours',
        difficulty: 'intermediate',
        isFree: false,
        estimatedCost: 19.99,
        certificateOffered: true,
      },
    ],
    video: [
      {
        title: 'Express JS Full Course',
        url: 'https://www.youtube.com/watch?v=Oe421EPjBE4',
        provider: 'YouTube - freeCodeCamp.org',
        channel: 'freeCodeCamp.org',
        views: 3000000,
        duration: '8 hours',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.8,
      },
    ],
    documentation: [
      {
        title: 'Express.js Official Documentation',
        url: 'https://expressjs.com/',
        provider: 'Express.js Foundation',
        difficulty: 'intermediate',
        isFree: true,
        rating: 5.0,
      },
    ],
  },

  'django': {
    course: [
      {
        title: 'Python and Django Full Stack Web Developer Bootcamp',
        url: 'https://www.udemy.com/course/python-and-django-full-stack-web-developer-bootcamp/',
        provider: 'Udemy',
        instructor: 'Jose Portilla',
        rating: 4.5,
        students: 200000,
        duration: '32 hours',
        difficulty: 'intermediate',
        isFree: false,
        estimatedCost: 19.99,
        certificateOffered: true,
      },
    ],
    video: [
      {
        title: 'Python Django Tutorial for Beginners',
        url: 'https://www.youtube.com/watch?v=rHux0gMZ3Eg',
        provider: 'YouTube - Programming with Mosh',
        channel: 'Programming with Mosh',
        views: 3000000,
        duration: '1 hour',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.9,
      },
    ],
    documentation: [
      {
        title: 'Django Official Documentation',
        url: 'https://docs.djangoproject.com/',
        provider: 'Django Software Foundation',
        difficulty: 'intermediate',
        isFree: true,
        rating: 5.0,
      },
    ],
  },

  // Databases
  'mongodb': {
    course: [
      {
        title: 'MongoDB - The Complete Developer\'s Guide 2024',
        url: 'https://www.udemy.com/course/mongodb-the-complete-developers-guide/',
        provider: 'Udemy',
        instructor: 'Maximilian Schwarzmüller',
        rating: 4.7,
        students: 100000,
        duration: '18 hours',
        difficulty: 'beginner',
        isFree: false,
        estimatedCost: 19.99,
        certificateOffered: true,
      },
    ],
    video: [
      {
        title: 'MongoDB Crash Course',
        url: 'https://www.youtube.com/watch?v=-56x56UppqQ',
        provider: 'YouTube - Traversy Media',
        channel: 'Traversy Media',
        views: 2000000,
        duration: '30 minutes',
        difficulty: 'beginner',
        isFree: true,
        rating: 4.8,
      },
    ],
    documentation: [
      {
        title: 'MongoDB Official Documentation',
        url: 'https://www.mongodb.com/docs/',
        provider: 'MongoDB Inc.',
        difficulty: 'intermediate',
        isFree: true,
        rating: 4.9,
      },
    ],
  },
};

module.exports = additionalResources;
