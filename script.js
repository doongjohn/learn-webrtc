const elInfo = document.getElementById('info');
const elChatView = document.getElementById('chat-view');
const elChatInput = document.getElementById('chat-input');

function chatInputStart() {
  elChatInput.removeAttribute('readonly');
  elChatInput.addEventListener('keypress', event => {
    if (event.ctrlKey && event.key == '\n') {
      elChatInput.value += '\n';
      return;
    }

    if (event.key == 'Enter') {
      event.preventDefault();
      const input = elChatInput.value.trimEnd();
      if (input) {
        sendText(input);
        createChatBubbleSelf(elChatInput.value);
      }
      elChatInput.value = '';
    }
  });
}

function createChatBubble(text) {
  const chatBubble = document.createElement('div');
  chatBubble.classList.add('chat-bubble');
  chatBubble.innerText = text;
  elChatView.appendChild(chatBubble);
  elChatView.scrollTop = elChatView.scrollHeight; // scroll to bottom
}
function createChatBubbleSelf(text) {
  const chatBubble = document.createElement('div');
  chatBubble.classList.add('chat-bubble-self');
  chatBubble.innerText = text;
  elChatView.appendChild(chatBubble);
  elChatView.scrollTop = elChatView.scrollHeight; // scroll to bottom
}
function createChatBubbleInfo(text) {
  const chatBubble = document.createElement('div');
  chatBubble.classList.add('chat-bubble-info');
  chatBubble.innerText = text;
  elChatView.appendChild(chatBubble);
  elChatView.scrollTop = elChatView.scrollHeight; // scroll to bottom
}

// connection data
const peer = new Peer(null, {
  'iceServers': [
    // Public STUN server list
    // https://gist.github.com/mondain/b0ec1cf5f60ae726202e
    { 'urls': 'stun.services.mozilla.com:3478' },
    { 'urls': 'stun.stunprotocol.org:3478' },
    { 'urls': 'stun.l.google.com:19302' },
    { 'urls': 'stun1.l.google.com:19302' },
    { 'urls': 'stun2.l.google.com:19302' },
    { 'urls': 'stun3.l.google.com:19302' },
    { 'urls': 'stun4.l.google.com:19302' },
    { 'urls': 'stunserver.org:3478' },
    { 'urls': 's1.voipstation.jp' },
    { 'urls': 's2.voipstation.jp' },
    { 'urls': 's1.taraba.net' },
    { 'urls': 's2.taraba.net' },
  ]
});
let initializer = false;
let initializerConn = null;
let oppConns = new Map();

function updateConnectionInfo(type) {
  if (initializer) {
    if (oppConns.size == 0) {
      elInfo.innerHTML = '🚀 share your link (no people in this chat)';
    } else {
      elInfo.innerHTML = `✔️ ${oppConns.size} people connected`;
    }
  } else {
    if (!type) return;
    switch (type) {
      case 'open':
        elInfo.innerHTML = '✔️ connected'
        break;
      case 'close':
        elInfo.innerHTML = '⛔ connection ended'
        break;
      case 'error':
        elInfo.innerHTML = '⛔ connection lost'
        break;
    }
  }
}

function connectTo(id, onOpen = null) {
  console.log('connecting...');
  const conn = peer.connect(id);
  conn.on('open', () => {
    onOpen?.call(this, conn);
    updateConnectionInfo('open');
    createChatBubbleInfo('connection started!');
  });
  conn.on('close', err => {
    oppConns.delete(id);
    updateConnectionInfo('close');
    createChatBubbleInfo('connection ended!');
    console.log(err);
  });
  conn.on('error', err => {
    oppConns.delete(id);
    updateConnectionInfo('error');
    createChatBubbleInfo('connection lost!');
    console.log(err);
  });
  return conn;
}

function disconnectFromInitializer() {
  initializerConn?.send({
    sender: peer.id,
    type: 'deinit',
    message: null
  });
  initializerConn?.close();
  peer.disconnect();
  peer.destroy();
}

function broadcast(fn) {
  for (const [id, conn] of oppConns)
    fn(id, conn);
}

function sendText(text) {
  if (initializer) {
    broadcast((id, conn) => {
      conn.send({
        sender: peer.id,
        type: 'txt',
        message: text
      });
    });
  } else {
    initializerConn.send({
      sender: peer.id,
      type: 'txt',
      message: text
    });
  }
}

let unloading = false;

function main() {
  // on page exit
  window.addEventListener('beforeunload', event => {
    unloading = true;
    disconnectFromInitializer();
  });
  window.addEventListener('unload', event => {
    disconnectFromInitializer();
  });
  document.addEventListener("visibilitychange", event => {
    if (unloading)
      disconnectFromInitializer();
  });
  window.addEventListener('pagehide', event => {
    if (!event.persisted)
      disconnectFromInitializer();
  });

  elInfo.innerText = '⚙️ initializing...';
  peer.on('open', id => {
    const prevID = sessionStorage.getItem('prevID');
    if (!location.hash || (location.hash && prevID && location.hash == prevID)) {
      // reloading the page will generate a fresh link
      initializer = true;
      location.hash = btoa(id);
      sessionStorage.setItem('prevID', location.hash);
      elInfo.innerText = `🚀 share your link`;
    } else {
      // connect to initializer
      elInfo.innerText = `🔎 connecting...`;
      const initializerId = atob(location.hash.substring(1));
      function initConnection() {
        initializerConn.send({
          sender: peer.id,
          type: 'init',
          message: null
        });
        chatInputStart();
      }
      const interval = setInterval(() => {
        initializerConn = connectTo(initializerId, () => {
          clearInterval(interval);
          initConnection();
        });
      }, 1000);
      initializerConn = connectTo(initializerId, () => {
        clearInterval(interval);
        initConnection();
      });
    }
  });

  peer.on('connection', (conn) => {
    conn.on('data', (data) => {
      console.log('data received!');
      switch (data.type) {
        case 'init':
          connectTo(data.sender, (conn) => {
            oppConns.set(data.sender, conn);
            chatInputStart();
          });
          break;
        case 'deinit':
          oppConns.get(data.sender).close();
          oppConns.delete(data.sender);
          updateConnectionInfo('');
          break;
        default:
          broadcast((id, conn) => {
            if (data.sender == id) return;
            conn.send({
              sender: id,
              type: 'txt',
              message: data.message
            });
          });
          // create chat bubble
          createChatBubble(data.message);
          break;
      }
    });
  });
}

main();