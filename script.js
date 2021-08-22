// const customGenerationFunction = () => (Math.random().toString(36) + '0000000000000000000').substr(2, 16);

let thisId;
let oppId;
let oppPeer;
let message;

console.log('app starting...');

const peer = new Peer('', {
  config: {
    'iceServers': [
      { url: 'stun:stun.l.google.com:19302' },
      { url: 'stun:stun1.l.google.com:19302' },
      { url: 'stun:stun2.l.google.com:19302' },
    ]
  }
});

console.log('peer opening...');

peer.on('open', (id) => {
  thisId = id;
  console.log(id);
});

peer.on('connection', (opp) => {
  console.log('connected to peer oppnent!');

  opp.on('data', (data) => {
    message = data.message;
    alert(data.message);
  });
});

function connectWithOpp(id) {
  console.log('connecting to peer oppnent...');

  oppPeer = peer.connect(id);

  oppPeer.on('open', () => {
    const msg = {
      sender: thisId,
      message: 'hello'
    };

    oppPeer.send(msg);
  });
}