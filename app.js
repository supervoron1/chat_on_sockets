const express = require('express');
const app = express();
const admin = require('firebase-admin');

const serviceAccount = require("./key/chat-5a88d-firebase-adminsdk-9g7n3-5a2d00c289.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://chat-5a88d.firebaseio.com"
});
const db = admin.database();

// const router = express.Router();
// var bodyParser = require('body-parser');
// router.use(bodyParser.json());
const PORT = 3000;

app.set('view engine', 'ejs');

app.use(express.static("public"));

// -------------- *** ASYNC *** -------------------
// router.get('/users', async (req, res) => {
//   const usersRef = db.ref('/users').once('value');
//   const messagesRef = db.ref('messages').once('value');
//   const values = await Promise.all([usersRef, messagesRef]);
//   const usersVal = values[0].val();
//   const messagesVal = values[1].val();
//   console.log(usersVal);
//   console.log(usersRef);
//   res.sendStatus(200);
// })
// const runDemo = async () => {
//   const usersVal = await example.firstAsyncRequest();
//   const messagesVal = await example.secondAsyncRequest(fistResponse);
//   const thirdAsyncRequest = await example.thirdAsyncRequest(secondResponse);
// };

let message = {
  "email": "user@mail.com",
  "image": "56",
  "isAdmin": false,
  "message": "Test from server",
  "timeSent": new Date().toString(),
  "userName": "Testovich",
}
const ref = admin.database().ref();
const messagesRef = ref.child('messages');
const usersRef = ref.child('users');
const logsRef = ref.child('logs');

// let messageRef = messagesRef.push(message);
// logsRef.child(messageRef.key).set(message);

logsRef.on('child_changed', function (snap) {
  console.log('changed', snap.val());
});

logsRef.on('child_removed', snap => {
  console.log('removed', snap.val());
})

// sample ref.on('value', snapshot => {})
// usersRef.on("value", snapshot => {
//   return snapshot.val();
// });

console.log('DB ' + db.ref() + ' connected');

app.get('/', (req, res) => {
  res.render('index');
});

server = app.listen(PORT, () => console.log(`Server is running on localhost:${PORT}...`));

const io = require('socket.io')(server);

io.on('connection', (socket) => {
  const username = socket.handshake.query.username;
  (username) ? socket.username = username : socket.username = 'Anonymous';

  usersRef.on('child_changed', snapshot => {
    let users = snapshot.val();
    io.sockets.emit('getUsers', { users });
  });

  console.log(`User ${socket.username} connected`);

  socket.on('disconnect', () => {
    console.log(`User ${socket.username} disconnected`);
  })

  socket.on('change_username', (data) => {
    console.log(`User ${socket.username} just changed his name to ${data.username}`);
    socket.username = data.username
  })

  socket.on('new_message', (data) => {
    io.sockets.emit('add_msg', {
      message: data.message,
      username: socket.username,
      className: data.className
    });
  })

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', {username: socket.username})
  })
})
