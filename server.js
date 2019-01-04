// Breaking News English formatter
// (c) Andrey Svetlichny, 2018

let https = require('https'),
    express = require('express');
    fs = require('fs');

let app = express();
let server = require('http').Server(app);

let items = [];
let index;

let head = `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
</head>\n`;

const host = "breakingnewsenglish.com";

getItems(function (res) {
    items = res;
    index = `<!doctype html><html>${head}<body><div class="container mt-3"><h3>Breaking News English</h3><ul class="list-group">` +
        items.map((v, i) => `<li class="list-group-item">${v.date}<br><a href="${i}">${v.name}</a></li>`).join('\n') +
        `</ul></div></body></html>`;

    server.listen(3000, function(){
        console.log('listening on *:3000');
    });
});

app.get('/', function(req, res){ res.send(index); });
app.get('/**', function(req, res){
    console.log(req.url);
    const item = items[req.url.slice(1)];
    if(!item) {
        res.status(404).send(`404 Not found ${req.url}`);
        return;
    }
    const uriMp3 = 'https://' + host + item.uri + '.mp3';

    getReadingContent(item.uri, function (readingContent) {
        const html = `<!doctype html><html>${head}<body><div class="container mt-2">
<h3>${item.name}</h3>
<h5>${item.date}</h5>
<audio id="audio" controls autoplay src="${uriMp3}">Your browser does not support the <code>audio</code> element.</audio>
<script>
document.getElementById("audio").onended = function() {
    window.location.href = window.location.origin + '/' + (Number(window.location.pathname.slice(1))+1); };
</script>
${readingContent}
</div></body></html>`;
        res.send(html);
    });
});

function getItems(callback) {
    getPage("/news-for-kids.html", content => {
        let items = [];
        const re = /<li><tt>(.*?): <\/tt><a.*?href="(.*?).html">(.*?)</g;
        let m;
        do {
            m = re.exec(content);
            if (m) items.push({date: m[1], uri: '/' + m[2], name: m[3]});
        } while (m);
        callback(items);
    });
}

function getReadingContent(uri, callback) {
    getPage(uri + "-l.html", content => {
        const re = /<strong>READING[\s\S]*?<\/p>\s*([\s\S]*?)\s*<!--/i;
        const readingContent = content.match(re)[1];
        callback(readingContent);
    });
}

function getPage(path, callback) {
    const req = https.request({host: host, port: 443, path: path}, res => {
        let content = "";
        res.setEncoding("utf8");
        res.on("data", chunk => content += chunk);
        req.on('error', e => console.log(e));
        res.on("end", () => callback(content));
    });
    req.end();
}