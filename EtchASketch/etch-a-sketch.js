// select the elements on the page - canvas, shake button
const canvas = document.querySelector('#etch-a-sketch');
const ctx = canvas.getContext('2d'); // ctx = common name for context
const shakeButton = document.querySelector('.shake');
const MOVE_AMOUNT = 15;

// setup our canvas for drawing
// make a variable called height and width from the same properties on our canvas.
const { width, height } = canvas;

// create random x and y starting points on the canvas
ctx.lineJoin = 'round';
ctx.lineCap = 'round';
ctx.lineWidth = MOVE_AMOUNT;

let x;
let y;
let hue = 0;

function restartDrawing() {
  x = Math.floor(Math.random() * width);
  y = Math.floor(Math.random() * height);

  ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
  ctx.beginPath(); // start the drawing
  ctx.moveTo(x, y);
  ctx.lineTo(x, y);
  ctx.stroke();
}

restartDrawing();

// write a draw function
function draw({ key }) {
  console.log(key);
  // incremenet the hue
  hue += 5;
  ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
  // start the path
  ctx.beginPath();
  ctx.moveTo(x, y);
  // move our x and y values depending on what the user did
  switch (key) {
    case 'ArrowUp':
      y -= MOVE_AMOUNT; // y = y - MOVE_AMOUNT;
      break;
    case 'ArrowRight':
      x += MOVE_AMOUNT;
      break;
    case 'ArrowDown':
      y += MOVE_AMOUNT;
      break;
    case 'ArrowLeft':
      x -= MOVE_AMOUNT;
      break;
    default:
      break;
  }

  ctx.lineTo(x, y);
  ctx.stroke();
}

// write a handler for the keys
function handleKey(e) {
  if (e.key.includes('Arrow')) {
    e.preventDefault();
    draw({ key: e.key });
  }
}

// clear / shake function
function clearCanvas() {
  canvas.classList.add('shake');
  ctx.clearRect(0, 0, width, height);
  restartDrawing();
  canvas.addEventListener(
    'animationend',
    function() {
      console.log('done the shake!');
      canvas.classList.remove('shake');
    },
    { once: true }
  );
}

shakeButton.addEventListener('click', clearCanvas);

// listen for arrow keys
window.addEventListener('keydown', handleKey);
