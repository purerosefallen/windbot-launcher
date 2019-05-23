/*
 Author: Nanahira
 License: AGPL3
*/
var http = require('http');
var https = require('https');
var child_process = require('child_process');
var url = require('url');
var loadJSON = require('load-json-file').sync;

var config = loadJSON('./config.json');

var responder = [];

function sendResponse(text, no_show) {
	if(!no_show)
		console.log(text);
	for(var unit of responder) {
		text=text.replace(/\n/g,"<br>");
		unit.write("data: " + text + "\n\n");
	}
}

var name_count = 0;
function get_name(p) {
	p.name = name_count;
	name_count++;
}

function launch_windbot(ip, port, name, pass, deck) { 
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
		get_name(proc);
		proc.stdout.setEncoding('utf8');
		proc.stdout.on('data', (function(p) {
			return function(data) {
				sendResponse(p.name + " STDOUT: " + data);
			}
		})(proc));
		proc.stderr.setEncoding('utf8');
		proc.stderr.on('data', (function(p) {
			return function(data) {
				sendResponse(p.name + " STDERR: " + data);
			}
		})(proc));
		proc.on('close', (function(p) {
			return function(code) {
				sendResponse('AI ' + p.name + ' 的决斗结束。 (' + code + ')');
				if (p.tcounter) {
					clearTimeout(p.tcounter);
				}
			}
		})(proc));
		proc.tcounter = setTimeout((function(p) {
			return function() {
				p.kill();
			}
		})(proc), 3600000);
		sendResponse("成功创建AI: " + proc.name);
	} catch (err) { 
		sendResponse("AI创建失败: " + err);
	}
}

function auth(user, pass) { 
	return config.users[user] && config.users[user] == pass;
}

function get_delete_fun(res) { 
	return function () { 
		const index = responder.indexOf(res);
		if (index != -1) {
			responder.splice(index, 1);
		}
	};
}

function requestListener(req, res) { 
	const u = url.parse(req.url, true);
	if (!auth(u.query.username, u.query.password)) {
		res.writeHead(403);
		res.end("用户名或密码错误。");
		return;
	}
	if (u.pathname === '/api/msg') {
		res.writeHead(200, {
			"Access-Control-Allow-origin": "*",
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			"Connection": "keep-alive"
		});
		
		res.on("close", get_delete_fun(res));
		
		responder.push(res);
		//console.log(responder.length);
		sendResponse("已连接。", true);
		
		
	}

	else if (u.pathname === '/api/launch') {
		res.writeHead(200);
		res.end(u.query.callback + '({"message":"正在启动AI。"});');
		launch_windbot(u.query.ip, u.query.port, u.query.name, u.query.pass, u.query.deck);
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
