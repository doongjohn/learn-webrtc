const elInfo = document.getElementById('info');
const elChatView = document.getElementById('chat-view');
const elChatInput = document.getElementById('chat-input');

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

// p2p data
let thisPeer = null;
let oppConn = null;

elInfo.innerText = '⚙️ initializing...';
thisPeer = new Peer();
thisPeer.on('open', (id) => {
  // if initializer reloads the page
  // it will regenerate fresh link
  const prevID = sessionStorage.getItem('prevID');
  if (location.hash && prevID) {
    if (location.hash == prevID) {
      // you are the initializer
      location.hash = btoa(id);
      sessionStorage.setItem('prevID', location.hash);
      elInfo.innerHTML = `🚀 share your link`;
      return;
    }
  }

  if (!location.hash) {
    // you are the initializer
    location.hash = btoa(id);
    sessionStorage.setItem('prevID', location.hash);
    elInfo.innerHTML = `🚀 share your link`;
  } else {
    // connect to initializer
    elInfo.innerText = `🔎 connecting...`;
    connectTo(atob(location.hash.substring(1)));
    oppConn.on('open', () => {
      oppConn.send({
        sender: thisPeer.id,
        type: 'init',
        message: ''
      });
    });
  }
});
thisPeer.on('connection', (opp) => {
  console.log('data received!');
  opp.on('data', (data) => {
    if (data.type == 'init') {
      connectTo(data.sender);
    } else {
      createChatBubble(data.message);
    }
  });
});

function connectTo(id) {
  console.log('connecting...');
  oppConn = thisPeer.connect(id);
  oppConn.on('open', () => {
    elInfo.innerHTML = `✔️ connected`;
    createChatBubbleInfo('connection started!');
  });
  oppConn.on('close', err => {
    elInfo.innerHTML = `⛔ connection ended`;
    createChatBubbleInfo('connection ended!');
    oppConn = null;
    console.log(err);
  });
  oppConn.on('error', err => {
    elInfo.innerHTML = `⛔ connection error`;
    oppConn = null;
    console.log(err);
  });
}

function sendText(text) {
  oppConn.send({
    sender: thisPeer.id,
    type: 'txt',
    message: text
  });
}

// input event
elChatInput.addEventListener('keypress', event => {
  if (!thisPeer || !oppConn) {
    event.preventDefault();
    return;
  }
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

// on page exit
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === 'hidden') {
    thisPeer.destroy();
  }
});
