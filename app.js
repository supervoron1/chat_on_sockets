const express = require("express");
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');

app.use(express.static("public"));

app.get('/', (req, res) => {
	res.render('index')
})
server = app.listen(PORT, () => console.log(`Server is running on localhost:${ PORT }...`));

const io = require("socket.io")(server);

io.on('connection', (socket) => {
  const username = socket.handshake.query.username;
  (username) ? socket.username = username : socket.username = 'Anonymous';
  console.log(`User ${socket.username} connected`);

  socket.on('disconnect', () => {
    console.log(`User ${socket.username} disconnected`);
  })

  socket.on('change_username', (data) => {
    console.log(`User ${socket.username} just changed his name to ${data.username}`);
    socket.username = data.username
  })

  socket.on('new_message', (data) => {
    io.sockets.emit('add_msg', {message : data.message, username : socket.username, className:data.className});
  })

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', {username : socket.username})
  })
})
