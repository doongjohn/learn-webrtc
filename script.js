const elInfo = document.getElementById('info');
const elChatView = document.getElementById('chat-view');
const elChatInput = document.getElementById('chat-input');

function createChatBubble(text) {
  const chatBubble = document.createElement('div');
  chatBubble.classList.add('chat-bubble');
  chatBubble.innerText = text;
  elChatView.appendChild(chatBubble);
}

function createChatBubbleSelf(text) {
  const chatBubble = document.createElement('div');
  chatBubble.classList.add('chat-bubble-self');
  chatBubble.innerText = text;
  elChatView.appendChild(chatBubble);
}

function createChatBubbleInfo(text) {
  const chatBubble = document.createElement('div');
  chatBubble.classList.add('chat-bubble-info');
  chatBubble.innerText = text;
  elChatView.appendChild(chatBubble);
}


let thisPeer = null;
let oppPeer = null;

console.log('initializing this peer...');
thisPeer = new Peer();

thisPeer.on('open', (id) => {
  if (!location.hash) {
    location.hash = btoa(id);
    const link = `localhost:5500/${location.hash}`;
    elInfo.innerHTML = `link: <a href="http://${link}">${link}</a>`;
  } else {
    elInfo.innerText = `connecting...`;
    const id = atob(location.hash.substring(1));
    connectTo(id);
  }
});

thisPeer.on('connection', (opp) => {
  console.log('data received!');
  opp.on('data', (data) => {
    if (data.type == 'init') {
      if (!oppPeer) connectTo(data.sender);
    } else {
      createChatBubble(data.message);
    }
  });
});

function connectTo(id) {
  console.log('connecting...');
  oppPeer = thisPeer.connect(id);
  oppPeer.on('error', (e) => {
    console.log(e);
  });
  oppPeer.on('open', () => {
    elInfo.innerHTML = `connected`;
    createChatBubbleInfo('connection successful!');
    oppPeer.send({
      sender: thisPeer.id,
      type: 'init',
      message: 'hello'
    });
  });
}

function sendText(text) {
  if (!oppPeer) return;
  const msg = {
    sender: thisPeer.id,
    type: 'txt',
    message: text
  };
  oppPeer.send(msg);
}


elChatInput.addEventListener('keypress', event => {
  if (event.ctrlKey && event.key == '\n') {
    elChatInput.value += '\n';
    return;
  }
  if (event.key == 'Enter') {
    event.preventDefault();
    sendText(elChatInput.value);
    createChatBubbleSelf(elChatInput.value);
    elChatInput.value = '';
  }
});