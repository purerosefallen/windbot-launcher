/*
 Author: Nanahira
 License: AGPL3
*/
var http = require('http');
var https = require('https');
var child_process = require('child_process');
var url = require('url');
var config = require('./config.json');

var responder = {};
var procs = [];

function sendResponse(login, text, no_show) {
	if(!no_show)
		console.log(login, text);
	if(responder[login]) {
		text=text.replace(/\n/g,"<br>");
		responder[login].write("data: " + text + "\n\n");
	}
}

var name_count = 0;
function get_name(p) {
	p.name = name_count;
	name_count++;
}

function launch_windbot(login, ip, port, name, pass, deck) { 
	try {
		var local, params;
		if (/^win/.test(process.platform)) {
			local = config.windbot.exec;
			params = [];
		} else {
			local = 'mono';
			params = [config.windbot.exec];
		}
		params.push('Name=' + name);
		params.push('Deck=' + deck);
		params.push('Host=' + ip);
		params.push('Port=' + port);
		params.push('HostInfo=' + pass);
		params.push('Version=' + config.windbot.version);
		params.push('Chat=false');
		params.push('AutoQuit=true');
		params.push('Debug=true');
		var proc = child_process.spawn(local, params, { cwd: config.windbot.path });
		proc.login = login;
		proc.room_info = {
			name: name,
			pass: pass,
			ip: ip,
			port: port,
			deck: deck,
		};
		get_name(proc);
		procs.push(proc);
		proc.stdout.setEncoding('utf8');
		proc.stdout.on('data', (function(p) {
			return function(data) {
				sendResponse(p.login, p.name + " STDOUT: " + data);
			}
		})(proc));
		proc.stderr.setEncoding('utf8');
		proc.stderr.on('data', (function(p) {
			return function(data) {
				sendResponse(p.login, p.name + " STDERR: " + data);
			}
		})(proc));
		proc.on('close', (function(p) {
			return function(code) {
				sendResponse(p.login, 'AI ' + p.name + ' 的决斗结束。 (' + code + ')');
				if (p.tcounter) {
					clearTimeout(p.tcounter);
				}
				const index = procs.indexOf(p);
				if (index >= 0)
					procs.splice(index, 1);
			}
		})(proc));
		proc.tcounter = setTimeout((function(p) {
			return function() {
				p.kill();
			}
		})(proc), 3600000);
		sendResponse(login, "成功创建AI: " + proc.name);
	} catch (err) { 
		sendResponse(login, "AI创建失败: " + err);
	}
}

function terminate(login, ip, port, name, pass, deck) { 
	var found = false;
	var kill_list = [];
	for (var proc of procs) { 
		//console.log(proc);
		if (proc &&
				proc.login === login &&
				proc.room_info.ip === ip &&
				proc.room_info.port === port &&
				proc.room_info.name === name &&
				proc.room_info.pass === pass &&
				proc.room_info.deck === deck
		) { 
			found = true;
			kill_list.push(proc);
		}
		for (var proc of kill_list) { 
			proc.kill();
		}
	}
	if (found) {
		sendResponse(login, "AI中止成功。");
	} else { 
		sendResponse(login, "未找到AI。");
	}
}

function auth(user, pass) { 
	return config.users[user] && config.users[user] == pass;
}

function get_delete_fun(login) { 
	return function () { 
		delete responder[login];
	};
}

function requestListener(req, res) { 
	const u = url.parse(req.url, true);
	if (!auth(u.query.username, u.query.password)) {
		res.writeHead(403);
		res.end("Auth failed.");
		return;
	}
	if (u.pathname === '/api/msg') {
		res.writeHead(200, {
			"Access-Control-Allow-origin": "*",
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			"Connection": "keep-alive"
		});
		res.on("close", get_delete_fun(u.query.username));
		
		responder[u.query.username] = res;
		//console.log(responder.length);
		sendResponse(u.query.username, "已连接。", true);
		
		
	}

	else if (u.pathname === '/api/launch') {
		res.writeHead(200);
		res.end(u.query.callback + '({"message":"正在启动AI。"});');
		launch_windbot(u.query.username, u.query.ip, u.query.port, u.query.name, u.query.pass, u.query.deck);
	}
	else if (u.pathname === '/api/terminate') {
		res.writeHead(200);
		res.end(u.query.callback + '({"message":"正在中止AI。"});');
		terminate(u.query.username, u.query.ip, u.query.port, u.query.name, u.query.pass, u.query.deck);
	}
    else {
        res.writeHead(400);
        res.end("400");
    }
}
http.createServer(requestListener).listen(config.port);

if (config.ssl.enabled) {
    const ssl_cert = fs.readFileSync(config.ssl.cert);
    const ssl_key = fs.readFileSync(config.ssl.key);
    const options = {
        cert: ssl_cert,
        key: ssl_key
    }
    https.createServer(options, requestListener).listen(config.ssl.port);
}
