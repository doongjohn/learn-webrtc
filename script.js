let thisPeer;
let oppPeer;

const peerConfig = {
  config: {
    'iceServers': [
      { url: 'stun:stun.l.google.com:19302' },
      { url: 'stun:stun1.l.google.com:19302' },
      { url: 'stun:stun2.l.google.com:19302' },
    ]
  }
};

console.log('initializing this peer...');
thisPeer = new Peer(null, peerConfig);

thisPeer.on('open', (id) => {
  console.log(`this peer opened! ${thisPeer.id}`);
});

thisPeer.on('connection', (opp) => {
  console.log('connected to oppnent peer!');
  opp.on('data', (data) => {
    if (data.type == 'init') {
      alert('other person has connected to you!');
    } else {
      alert(data.message);
    }
  });
});

function connectTo(id) {
  console.log('connecting...');
  oppPeer = thisPeer.connect(id);

  oppPeer.on('open', () => {
    console.log('connected!');
    const msg = {
      sender: thisPeer.id,
      type: 'init',
      message: 'hello'
    };
    oppPeer.send(msg);
  });
}

function sendText(text) {
  const msg = {
    sender: thisPeer.id,
    type: 'txt',
    message: text
  };
  oppPeer.send(msg);
}