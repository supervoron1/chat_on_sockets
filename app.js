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

const ref = admin.database().ref();
const messagesRef = ref.child('messages');
const usersRef = ref.child('users');
const chatsRef = ref.child('chats');
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

console.log('Database connected on ' + db.ref());

app.get('/', (req, res) => {
  res.render('index');
});

server = app.listen(PORT, () => console.log(`Server is running on localhost:${PORT}...`));

const io = require('socket.io')(server);

io.on('connection', (socket) => {
  const username = socket.handshake.query.userName;
  let data = socket.handshake.query;
  delete data.EIO;
  delete data.t;
  delete data.transport;
  (username) ? socket.username = username : socket.username = 'Anonymous';
  (data.userName !== 'Admin') ? usersRef.push(data) : false; // добавить проверку на дубль в БД

  usersRef.on('value', snapshot => {
    let users = snapshot.val();
    io.sockets.emit('getUsers', users);
  });

  messagesRef.on('value', snapshot=>{
    let messages = snapshot.val();
    io.sockets.emit('getMessages', messages);
  })

  console.log(`User ${socket.username} connected`);

  socket.on('disconnect', () => {
    const userID = socket.handshake.query.userID;
    usersRef.orderByChild('userID').equalTo(`${userID}`).once('value', snapshot => {
      snapshot.forEach(child => {
        child.ref.update({"status": "offline"});
      })
    });
    console.log(`User ${socket.username} disconnected`);
  })

  socket.on('change_username', (data) => {
    console.log(`User ${socket.username} just changed his name to ${data.username}`);
    io.sockets.emit('userNameChanged', {
      prevName: socket.username,
      currName: data.username,
    })
    socket.username = data.username
  })

  // socket.on('new_message', (data) => {
  //   messagesRef.push(data);
  //   io.sockets.emit('add_msg', {
  //     message: data.message,
  //     userID: data.userID,
  //     userName: socket.username,
  //     timeSent: data.timeSent,
  //     image: data.image,
  //     isAdmin: data.isAdmin,
  //   });
  // })

  socket.on('new_message', (data) => {
    chatsRef.child(`${data.chatID}`).push(data);
    io.sockets.emit('add_msg', {
      message: data.message,
      userID: data.userID,
      userName: socket.username,
      timeSent: data.timeSent,
      image: data.image,
      isAdmin: data.isAdmin,
    });
  })

  /*TODO переписать метод получения сообщений для новой структуры БД */
  // socket.on('get_user_chat', (data) => {
  //   const chatID = data.chatID;
  //   if (chatID) {
  //     messagesRef.orderByChild('chatID').equalTo(`${chatID}`).on('value', snapshot => {
  //       let messages = snapshot.val();
  //       io.sockets.emit('getMessagesForChatID', messages);
  //       // messages ? io.sockets.emit('getMessagesForChatID', messages) : io.sockets.emit('getMessagesForID', false);
  //     });
  //   }
  //
  // })

  socket.on('get_user_chat', (data) => {
    const chatID = data.chatID;
    if (chatID) {
      chatsRef.child(`${chatID}`).on('value', snapshot => {
        let messages = snapshot.val();
        io.sockets.emit('getMessagesForChatID', messages);
        // messages ? io.sockets.emit('getMessagesForChatID', messages) : io.sockets.emit('getMessagesForID', false);
      });
    }

  })

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', {username: socket.username})
  })
})
