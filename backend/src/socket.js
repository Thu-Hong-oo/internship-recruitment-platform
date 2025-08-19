const setupSocket = (server) => {
  const { Server } = require('socket.io');
  const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
  io.on('connection', (socket) => {
    socket.join('jobs');
  });
  return io;
};

module.exports = { setupSocket };



