var zeeWorker = new Worker('lib/zee/zee-worker.js');
var zeeCallbacks = [];

zeeWorker.onmessage = function (msg) {
  zeeCallbacks[msg.data.callbackID](msg.data.data);
  console.log("zee'd " + msg.data.filename + ' in ' + msg.data.time + ' ms, ' + msg.data.data.length + ' bytes');
  zeeCallbacks[msg.data.callbackID] = null;
};

function requestZee(filename, data, callback) {
  zeeWorker.postMessage({
    filename: filename,
    data: data, // do not send over the underlying ArrayBuffer
    callbackID: zeeCallbacks.length
  });
  zeeCallbacks.push(callback);
}

var req = new XMLHttpRequest();
req.open("GET", "http://zalf-lse.github.io/pp/pp_47.375_15.125.json.gz", true);
req.responseType = "arraybuffer";
req.onload = function () {

  var json = '';
  requestZee('rr_47.375_15.125.json.gz', new Uint8Array(req.response), function (data) {
    for (var i = 0, is = data.byteLength; i < is; i++)
      json += String.fromCharCode(data[i])
    console.log(JSON.parse(json));
  });

};

req.send(null);
