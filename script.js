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
let oppConn = null;
let oppId = null;

function main() {

  elInfo.innerText = '⚙️ initializing...';
  peer.on('open', id => {
    const prevID = sessionStorage.getItem('prevID');
    if (!location.hash || (location.hash && prevID && location.hash == prevID)) {
      // if you are the initializer
      // reloading the page will generate a fresh link
      location.hash = btoa(id);
      sessionStorage.setItem('prevID', location.hash);
      elInfo.innerText = `🚀 share your link`;
      return;
    }

    // connect to initializer
    elInfo.innerText = `🔎 connecting...`;
    oppId = atob(location.hash.substring(1));
    function initConnection() {
      oppConn.send({
        sender: peer.id,
        type: 'init',
        message: ''
      });
      chatInputStart();
    }
    const interval = setInterval(() => {
      oppConn = connectTo(oppId, () => {
        clearInterval(interval);
        initConnection();
      });
    }, 1000);
    oppConn = connectTo(oppId, () => {
      clearInterval(interval);
      initConnection();
    });
  });

  peer.on('connection', (conn) => {
    conn.on('data', (data) => {
      console.log('data received!');
      switch (data.type) {
        case 'init':
          // when you are the initializer
          oppConn = connectTo(data.sender);
          chatInputStart();
          break;
        default:
          // create chat bubble
          createChatBubble(data.message);
          break;
      }
    });
  });

  // on page exit
  window.addEventListener('beforeunload', event => {
    event.preventDefault();
    event.returnValue = '';
    const result = confirm();
    if (result) {
      peer?.destroy();
      window.close();
    }
  });
  // document.addEventListener('visibilitychange', () => {
  //   if (document.visibilityState === 'hidden')
  //     peer?.destroy();
  // });
  window.addEventListener('pagehide', event => {
    if (!event.persisted) {
      peer?.destroy();
    }
  });
}

function connectTo(id, onOpen = null) {
  console.log('connecting...');
  const conn = peer.connect(id);
  conn.on('open', () => {
    onOpen?.call(this);
    elInfo.innerHTML = `✔️ connected`;
    createChatBubbleInfo('connection started!');
  });
  conn.on('close', err => {
    elInfo.innerHTML = `⛔ connection ended`;
    createChatBubbleInfo('connection ended!');
    console.log(err);
  });
  conn.on('error', err => {
    elInfo.innerHTML = `⛔ connection lost`;
    createChatBubbleInfo('connection lost!');
    console.log(err);
  });
  return conn;
}

function sendText(text) {
  oppConn.send({
    sender: peer.id,
    type: 'txt',
    message: text
  });
}

main();