const express = require('express');
const mongoose = require('mongoose')
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const AuthRoutes = require('./src/routes/AuthRoutes');
const ContactRoutes = require('./src/routes/ContactRoutes');
// const contactRoutes = require('./routes/contactRoutes');


const app = express();
app.use(cors());


app.use(express.json());
// MongoDB connection
mongoose.connect("mongodb+srv://akshayghugare0:root@cluster0.rwu4clq.mongodb.net/audiocall?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.use('/api/auth', AuthRoutes);
app.use('/api/contact',ContactRoutes );

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // For development, allow all origins
    methods: ["GET", "POST"],
  },
});

    const users = {}; // Map to track user mobile number to socket mapping

    io.on('connection', (socket) => {
      console.log(`User Connected: ${socket.id}`);
    
      socket.on('registerUser', (data) => {
        const { mobileNumber } = data;
        users[mobileNumber] = socket.id;
        io.emit('users', users); // Optionally, broadcast user list
      });
    
      socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
        // Cleanup userSocketMap on disconnect
        for (let mobileNumber in users) {
          if (users[mobileNumber] === socket.id) {
            delete users[mobileNumber];
            break;
          }
        }
        io.emit('users', users); // Optionally, update user list
      });
    
      // Handle call initiation
      socket.on('callUser', ({ from, to, signal }) => {
        io.to(users[to]).emit('receivingCall', { from, signal });
      });
    
      // Handle call answer
      socket.on('acceptCall', (data) => {
        io.to(users[data.to]).emit('callAccepted', data.signal);
      });
    
      // Handle ICE candidates
      socket.on('sendCandidate', ({ to, candidate }) => {
        io.to(users[to]).emit('receiveCandidate', { candidate });
      });
    });

    //for new socket
 
const activeUsers = {};

io.on('connection', (socket) => {
    console.log('New connection: ', socket.id);

    socket.on('userName', (data) => {
        activeUsers[socket.id] = data;
        console.log('Active Users:', activeUsers);

        io.sockets.emit('newUserConnected', activeUsers);
    });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
