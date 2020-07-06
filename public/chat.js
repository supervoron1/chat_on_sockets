$(function () {
  const token = generateToken(16);
  const image = Math.round(Math.random() * 98);
  var socket = io.connect("http://localhost:3000", {
    query:
      {
        userID: token,
        image: image,
        isAdmin: false,
        email: 'anonymous@mail.net',
        userName: 'Anonymous',
        status: 'online'
      }
  });

  var message = $("#message");
  var username = $("#username");
  var name = $("#name");
  var send_message = $("#send_message");
  var send_username = $("#send_username");
  var chatroom = $("#chatroom");
  var feedback = $("#feedback");


  function generateToken(n) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < n; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
  }

  send_message.click(() => {
    if (message.val().length > 0) {
      socket.emit("new_message", {
        message: message.val(),
        // className: alertClass,
        // email: 'test@mail.ru',
        timeSent: new Date(),
        image,
        isAdmin: false,
        userID: token,
      });
    }
  });

  socket.on("add_msg", data => {
    feedback.html("");
    message.val("");
    chatroom.append(`
        <div class="output-message">
        <img class="" src="https://randomuser.me/api/portraits/thumb/men/${data.image}.jpg" alt="">
        <b>${data.userName}</b>: ${data.message}
        </div>
    `);
  });

  send_username.click(() => {
    if (username.val().length > 0) {
      socket.emit("change_username", {username: username.val()});
      const userName = username.val().replace(/\b\w/, (str) => str.toUpperCase());
      name.html(`<div><b>${userName}</b></div>`);
      username.val('');
    }
  });

  message.bind("keypress", () => {
    socket.emit("typing");
  });

  socket.on("typing", data => {
    feedback.html(`<p><i>${data.username} печатает сообщение...</i></p>`);
  });

});
