var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var mongoose = require('mongoose');
var usernames = [];

server.listen(3000);
mongoose.connect('mongodb://localhost/chat',function (err){
	if(err) console.log(err);
	else console.log('connected to DB')
});

var msgSchema = mongoose.Schema({
	name: String,
	msg: String,
	time: {type: String, default: new Date().toString()}
});

var chat = mongoose.model('message', msgSchema);

app.get('/',function(req,res) {
	res.sendFile(__dirname + '/index.html');
});


io.sockets.on('connection',function(socket){

	chat.find({},function(err,docs){
		if (err) throw err;
		socket.emit('loadmessage', docs);
	});

	socket.on('enter_user',function(data,callback){
		if (usernames.indexOf(data) != -1) {
			callback (false);
		}
		else {
			callback (true);
			socket.username = data;
			usernames.push(socket.username);
			updateUsernames();
		}
	});

	function updateUsernames(){
		io.sockets.emit('names',usernames);
	}

	socket.on('send_message',function(data){
		var newMsg = new chat ({msg:data,name:socket.username});
		newMsg.save (function(err) {
			if (err) throw err;
			else io.sockets.emit('new_message',{msg:data,name:socket.username});
		});
	});

	socket.on('disconnect',function(data){
		if (!socket.username) return;		
		usernames.splice(usernames.indexOf(socket.username),1);
		updateUsernames();
	});
});