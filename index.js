const fs      = require('fs');
const rp      = require('request-promise');
const request = require('request');
const cheerio = require('cheerio');
const path    = require('path');
const Agent   = require('socks5-https-client/lib/Agent');

let url = 'https://down.70sec.com/';

run([{
	link: url,
	title: '/'
}]).then(() => {
	console.log('所有文件都已完成下载!')
})

function run(tasks) {
	return new Promise(async (resolve, reject) => {
		for (var i = 0; i < tasks.length; i++) {
			var task = tasks[i];
			var matched = task.title.match(/\.([0-9a-z]+)$/i);
			if (matched === null) {
				var newTasks = await fetchTasks(task.link);
				await run(newTasks)
			} else {
				await download(task);
			}
		}
		resolve('done')
	});
}

function download(task) {
	return new Promise((resolve, reject) => {
		var matched = decodeURIComponent(task.link).match(/down.70sec.com\/(.*)\//i)
		var dir = (matched === null) ? '/' : matched[1];
		mkdirsSync('download/' + dir, '766');
		var file = 'download/' + dir + '/' + decodeURIComponent(task.title);
		if (fs.existsSync(file)) return resolve('done');
		var writeStream = fs.createWriteStream(file);
		writeStream.on('finish', function() {
			console.log('下载完成: ', dir + '/' + decodeURIComponent(task.title))
			resolve('done')
		});
		rp({
			uri: task.link,
			// strictSSL: true,
			// agentClass: Agent,
			// agentOptions: {
			// 	socksHost: 'localhost', // Defaults to 'localhost'.
			// 	socksPort: 1080 // Defaults to 1080.
			// }
		}).pipe(writeStream);
	});
}

function fetchTasks(uri) {
	return new Promise(async (resolve, reject) => {
		var $ = await rp({
			uri: uri,
			transform: function (body, resp) {
				return cheerio.load(body);
			}
		});

		var tasks = [];
		$('#list').find('a').each((i, el) => {
			var title = $(el).attr('title');
			var link  = $(el).attr('href');
			if (title) {
				tasks.push({
					title: title,
					link: uri + link
				})
			}
		})
		resolve(tasks);
	});
}

function mkdirsSync(dirname, mode){
  if(fs.existsSync(dirname)) {
    return true;
  } else {
    if(mkdirsSync(path.dirname(dirname), mode)){
      fs.mkdirSync(dirname, mode);
      return true;
    }
  }
}
