const express = require('express');
const app = express();
const admin = require('firebase-admin');

const serviceAccount = require("./key/chat-5a88d-firebase-adminsdk-9g7n3-5a2d00c289.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://chat-5a88d.firebaseio.com"
});
const db = admin.database();

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

console.log('Database connected on ' + db.ref());

// app.get('/', (req, res) => {
//   res.render('index');
// });

server = app.listen(PORT, () => console.log(`Server is running on localhost:${PORT}...`));

const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('------------ New Socket engaged... --------------')
  console.log('socketID: ' + socket.id);
  const userID = socket.handshake.query.userID;
  console.log('userID on handshake: ' + userID);
  // sample
  // const userID = 'admin';
  // usersRef.once('value', snapshot => {
  //   let IDs = snapshot.val()
  //   if (!snapshot.child('-MAs9X5Y7e94PlC3-hg-').exists()) {
  //     console.log('found it');
  //   } else {
  //     console.log('no match');
  //   }
  // })

  // sample query
  // let chatID = 'JONgKwmdLDU8qYHR9QD49yG7CgerzIyI_admin';
  // messagesRef.orderByChild('chatID').equalTo(`${chatID}`).on('value', snapshot => {
  //   let messages = snapshot.val();
  //   console.log(messages);
  // });

  usersRef.once('value', snapshot => {
    if (!snapshot.child(`${userID}`).exists()) {
      let data = {
        userID: generateToken(16),
        userName: 'Anonymous',
        image: Math.round(Math.random() * 98),
        status: 'online',
        created: new Date().toISOString(),
        isAdmin: false,
      }
      // push key name first, then populate with values
      usersRef.child(`${data.userID}`).push();
      usersRef.child(`${data.userID}`).set(data);
      // usersRef.child(`${data.userID}`).push().set(data); // not the same as above
      io.to(`${socket.id}`).emit('storeUserID', `${data.userID}`);
      io.to(`${socket.id}`).emit('storeSocketID', `${socket.id}`);
      console.log(`User ${data.userID} connected`);
      console.log(`SocketID ${socket.id} connected`);
    } else {
      console.log(`User ${userID} connected`);
      io.to(`${socket.id}`).emit('storeSocketID', `${socket.id}`);
      // set status to ONLINE
      usersRef.orderByChild('userID').equalTo(`${userID}`).once('value', snapshot => {
        snapshot.forEach(child => {
          child.ref.update({"status": "online"});
        })
      });
    }
  })

  usersRef.on('value', snapshot => {
    let users = snapshot.val();
    // console.log(users);
    io.sockets.emit('getUsers', users);
  });

  messagesRef.on('value', snapshot => {
    let messages = snapshot.val();
    io.sockets.emit('getMessages', messages);
  })

  messagesRef.on("value", snapshot => {
    let messages = snapshot.val();
    io.sockets.emit('getMessagesForUser', messages);
  })


  socket.on('disconnect', () => {
    const userID = socket.handshake.query.userID;
    usersRef.orderByChild('userID').equalTo(`${userID}`).once('value', snapshot => {
      snapshot.forEach(child => {
        child.ref.update({"status": "offline"});
      })
    });
    console.log(`User ${userID} disconnected`);
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

  /* TODO переписать метод получения сообщений для новой структуры БД */
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
    let socketID = socket.id;
    console.log('socket_id in get_chat: ' + socket.id);
    if (chatID) {
      chatsRef.child(`${chatID}`).on('value', snapshot => {
        let messages = snapshot.val();
        // io.sockets.emit('getMessagesForChatID', messages);
        io.to(`${socketID}`).emit('getMessagesForChatID', messages);
        // messages ? io.sockets.emit('getMessagesForChatID', messages) : io.sockets.emit('getMessagesForID', false);
      });
    }

  })
  socket.on('get_user_data', data => {
    const userID = data.userID;
    // console.log('user_id from get_user_data: ' + userID);
    usersRef.child(`${userID}`).on('value', snapshot => {
      let data = snapshot.val();
      // io.sockets.emit('getUserByID', data);
      io.to(`${socket.id}`).emit('getUserByID', data);
    })
  })

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', {username: socket.username})
  })

  function generateToken(n) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < n; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
  }
})
