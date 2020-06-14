$(function() {
  var socket = io.connect("http://localhost:3000");

  var message = $("#message");
  var username = $("#username");
  var name = $("#name");
  var send_message = $("#send_message");
  var send_username = $("#send_username");
  var chatroom = $("#chatroom");
  var feedback = $("#feedback");


  send_message.click(() => {
    if (message.val().length > 0) {
      socket.emit("new_message", {
        message: message.val(),
        className: alertClass
      });
    }
  });


  var min = 1;
  var max = 6;
  var random = Math.floor(Math.random() * (max - min)) + min;

  // Устаналиваем класс в переменную в зависимости от случайного числа
  // Эти классы взяты из Bootstrap стилей
  var alertClass;
  switch (random) {
    case 1:
      alertClass = "secondary";
      break;
    case 2:
      alertClass = "danger";
      break;
    case 3:
      alertClass = "success";
      break;
    case 4:
      alertClass = "warning";
      break;
    case 5:
      alertClass = "info";
      break;
    case 6:
      alertClass = "light";
      break;
  }

  socket.on("add_msg", data => {
    feedback.html("");
    message.val("");
    chatroom.append(`<div class='alert alert-${data.className}'><b>${data.username}</b>: ${data.message}</div>`);
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
