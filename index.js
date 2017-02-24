var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redisClient = require('redis').createClient();

app.use(express.static('public'));

io.on('connection', function(socket){
  console.log('socket connected');
  socket.on('chat message', function(msg){
    console.log(msg);
    io.emit('chat message', msg);
  });
  socket.on('nickname', function(nickname){
    io.broadcast('nickname', { nickname:nickname, joined: true });
  });
  socket.on('chatHead', function(chathead){
    console.log(JSON.stringify(chathead));
  });
});

io.on('disconnect', function(socket){
  console.log('disconnected');
  socket.on('chat message', function(msg){
    console.log(msg);
    io.emit('chat message', msg);
  });
  socket.on('nickname', function(nickname){
    console.log(msg);
    io.broadcast('nickname', { nickname:nickname, joined: true });
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});
