// Stub for canvas module on client-side
// This prevents pdfjs-dist from trying to require canvas in the browser
// Browser has native canvas API, so we don't need the Node.js canvas module

// Export empty object to prevent errors
module.exports = {};

// If pdfjs-dist tries to use canvas methods, they will fail gracefully
// The browser's native canvas API will be used instead via react-pdf

