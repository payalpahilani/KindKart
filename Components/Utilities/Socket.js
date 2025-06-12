import { io } from "socket.io-client"

const socket = io("https://chatserver-xo7s.onrender.com", {
  transports: ["websocket"], 
  reconnection: true,
});

export default socket

