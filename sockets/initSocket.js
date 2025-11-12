import { Server } from "socket.io";
// import { socketAuth } from "../middlewares/socketAuth.js"


const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });
  // io.use(socketAuth);

  return io;
};

export default initSocket;