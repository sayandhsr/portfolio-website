import React, { useState, useEffect, useRef, useCallback } from 'react';

// Common retro styles
const gameContainerStyle = {
  width: '100%',
  height: '100%',
  background: '#a3c68c', // Classic Nokia screen green/gray
  color: '#2a3b22', // Classic dark LCD pixels
  fontFamily: '"Courier New", Courier, monospace',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
};

const playBeep = (ctx, type = 'eat') => {
  if (!ctx || ctx.state !== 'running') return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    if (type === 'eat') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    } else if (type === 'die') {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    } else if (type === 'bounce') {
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
    } else if (type === 'break') {
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
    }
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (type === 'die' ? 0.3 : 0.1));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (type === 'die' ? 0.3 : 0.1));
  } catch (e) {}
};

export const SnakeGame = ({ onExit }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const audioCtxRef = useRef(null);
  
  const gridSize = 15;
  const tileCountX = 20;
  const tileCountY = 20;

  const snake = useRef([{ x: 10, y: 10 }]);
  const apple = useRef({ x: 15, y: 10 });
  const velocity = useRef({ x: 1, y: 0 });
  const nextVelocity = useRef({ x: 1, y: 0 });
  const gameLoop = useRef(null);

  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const handleKeyDown = (e) => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (velocity.current.y !== 1) nextVelocity.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (velocity.current.y !== -1) nextVelocity.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (velocity.current.x !== 1) nextVelocity.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (velocity.current.x !== -1) nextVelocity.current = { x: 1, y: 0 };
          break;
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (!touchStartX || !touchStartY) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      
      // Minimum swipe distance
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && velocity.current.x !== -1) nextVelocity.current = { x: 1, y: 0 };
        else if (dx < 0 && velocity.current.x !== 1) nextVelocity.current = { x: -1, y: 0 };
      } else {
        if (dy > 0 && velocity.current.y !== -1) nextVelocity.current = { x: 0, y: 1 };
        else if (dy < 0 && velocity.current.y !== 1) nextVelocity.current = { x: 0, y: -1 };
      }
      touchStartX = 0;
      touchStartY = 0;
    };

    const handleTouchMove = (e) => {
      e.preventDefault(); // Prevent scrolling while playing
    };

    window.addEventListener('keydown', handleKeyDown);
    if (canvasRef.current) {
      canvasRef.current.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvasRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvasRef.current.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('touchstart', handleTouchStart);
        canvasRef.current.removeEventListener('touchmove', handleTouchMove);
        canvasRef.current.removeEventListener('touchend', handleTouchEnd);
      }
      if (gameLoop.current) clearInterval(gameLoop.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  const spawnApple = () => {
    apple.current = {
      x: Math.floor(Math.random() * tileCountX),
      y: Math.floor(Math.random() * tileCountY)
    };
  };

  const draw = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    
    // Background
    ctx.fillStyle = '#a3c68c';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (gameOver) {
      ctx.fillStyle = '#2a3b22';
      ctx.font = '20px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvasRef.current.width/2, canvasRef.current.height/2 - 10);
      ctx.fillText('SCORE: ' + score, canvasRef.current.width/2, canvasRef.current.height/2 + 20);
      return;
    }

    // Move
    velocity.current = nextVelocity.current;
    let head = { x: snake.current[0].x + velocity.current.x, y: snake.current[0].y + velocity.current.y };
    
    // Wrap around
    if (head.x < 0) head.x = tileCountX - 1;
    if (head.x >= tileCountX) head.x = 0;
    if (head.y < 0) head.y = tileCountY - 1;
    if (head.y >= tileCountY) head.y = 0;

    // Collision
    for (let part of snake.current) {
      if (part.x === head.x && part.y === head.y) {
        setGameOver(true);
        playBeep(audioCtxRef.current, 'die');
        return;
      }
    }

    snake.current.unshift(head);

    // Eat apple
    if (head.x === apple.current.x && head.y === apple.current.y) {
      setScore(s => s + 10);
      playBeep(audioCtxRef.current, 'eat');
      spawnApple();
    } else {
      snake.current.pop();
    }

    // Draw Apple
    ctx.fillStyle = '#2a3b22';
    ctx.fillRect(apple.current.x * gridSize, apple.current.y * gridSize, gridSize - 1, gridSize - 1);

    // Draw Snake
    ctx.fillStyle = '#2a3b22';
    for (let part of snake.current) {
      ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    }
  }, [gameOver, score]);

  useEffect(() => {
    if (!gameOver) {
      gameLoop.current = setInterval(draw, 100);
    }
    return () => clearInterval(gameLoop.current);
  }, [draw, gameOver]);

  return (
    <div style={gameContainerStyle}>
      <div style={{ position: 'absolute', top: 10, left: 10, fontWeight: 'bold' }}>SCORE: {score}</div>
      <button 
        onClick={onExit}
        style={{ position: 'absolute', top: 10, right: 10, background: '#2a3b22', color: '#a3c68c', border: 'none', padding: '5px 10px', cursor: 'pointer', fontFamily: '"Courier New"' }}
      >
        EXIT
      </button>
      <canvas 
        ref={canvasRef} 
        width={tileCountX * gridSize} 
        height={tileCountY * gridSize} 
        style={{ border: '2px solid #2a3b22' }}
      />
      {gameOver && (
        <button 
          onClick={() => {
            snake.current = [{x: 10, y: 10}];
            velocity.current = {x:1, y:0};
            nextVelocity.current = {x:1, y:0};
            setScore(0);
            setGameOver(false);
          }}
          style={{ marginTop: 20, background: '#2a3b22', color: '#a3c68c', border: 'none', padding: '10px 20px', cursor: 'pointer', fontFamily: '"Courier New"' }}
        >
          RETRY
        </button>
      )}
    </div>
  );
};

export const BreakoutGame = ({ onExit }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const audioCtxRef = useRef(null);

  const paddleHeight = 10;
  const paddleWidth = 60;
  const ballRadius = 4;
  
  const paddleX = useRef(120);
  const rightPressed = useRef(false);
  const leftPressed = useRef(false);
  
  const ball = useRef({ x: 150, y: 250, dx: 3, dy: -3 });
  
  const brickRowCount = 4;
  const brickColumnCount = 6;
  const brickWidth = 40;
  const brickHeight = 15;
  const brickPadding = 5;
  const brickOffsetTop = 30;
  const brickOffsetLeft = 15;
  
  const bricks = useRef([]);
  const gameLoop = useRef(null);

  // Initialize bricks
  useEffect(() => {
    let b = [];
    for (let c = 0; c < brickColumnCount; c++) {
      b[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        b[c][r] = { x: 0, y: 0, status: 1 };
      }
    }
    bricks.current = b;
  }, []);

  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const handleKeyDown = (e) => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
      }
      if (e.key === 'ArrowRight') rightPressed.current = true;
      if (e.key === 'ArrowLeft') leftPressed.current = true;
    };
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowRight') rightPressed.current = false;
      if (e.key === 'ArrowLeft') leftPressed.current = false;
    };

    const handleTouchMove = (e) => {
      e.preventDefault(); // Prevent scrolling
      if (!canvasRef.current) return;
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const rect = canvasRef.current.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      
      // Center paddle on touch
      let newX = touchX - paddleWidth / 2;
      if (newX < 0) newX = 0;
      if (newX > canvasRef.current.width - paddleWidth) newX = canvasRef.current.width - paddleWidth;
      
      paddleX.current = newX;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    if (canvasRef.current) {
      canvasRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('touchmove', handleTouchMove);
      }
      if (gameLoop.current) cancelAnimationFrame(gameLoop.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  const draw = useCallback(() => {
    if (!canvasRef.current || gameOver || won) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#a3c68c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Bricks
    ctx.fillStyle = '#2a3b22';
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        if (bricks.current[c][r].status === 1) {
          let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
          let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
          bricks.current[c][r].x = brickX;
          bricks.current[c][r].y = brickY;
          ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
        }
      }
    }

    // Draw Paddle
    ctx.fillRect(paddleX.current, canvas.height - paddleHeight, paddleWidth, paddleHeight);

    // Draw Ball
    ctx.beginPath();
    ctx.arc(ball.current.x, ball.current.y, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Collision detection with bricks
    let activeBricks = 0;
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        let b = bricks.current[c][r];
        if (b.status === 1) {
          activeBricks++;
          if (
            ball.current.x > b.x &&
            ball.current.x < b.x + brickWidth &&
            ball.current.y > b.y &&
            ball.current.y < b.y + brickHeight
          ) {
            ball.current.dy = -ball.current.dy;
            b.status = 0;
            setScore(s => s + 10);
            playBeep(audioCtxRef.current, 'break');
          }
        }
      }
    }

    if (activeBricks === 0) {
      setWon(true);
      return;
    }

    // Collision detection with walls
    if (ball.current.x + ball.current.dx > canvas.width - ballRadius || ball.current.x + ball.current.dx < ballRadius) {
      ball.current.dx = -ball.current.dx;
      playBeep(audioCtxRef.current, 'bounce');
    }
    if (ball.current.y + ball.current.dy < ballRadius) {
      ball.current.dy = -ball.current.dy;
      playBeep(audioCtxRef.current, 'bounce');
    } else if (ball.current.y + ball.current.dy > canvas.height - ballRadius) {
      if (ball.current.x > paddleX.current && ball.current.x < paddleX.current + paddleWidth) {
        ball.current.dy = -ball.current.dy;
        // Add a bit of english depending on where it hit
        ball.current.dx = ball.current.dx + (ball.current.x - (paddleX.current + paddleWidth/2)) * 0.1;
        playBeep(audioCtxRef.current, 'bounce');
      } else {
        setGameOver(true);
        playBeep(audioCtxRef.current, 'die');
        return;
      }
    }

    // Move Paddle
    if (rightPressed.current && paddleX.current < canvas.width - paddleWidth) {
      paddleX.current += 5;
    }
    else if (leftPressed.current && paddleX.current > 0) {
      paddleX.current -= 5;
    }

    ball.current.x += ball.current.dx;
    ball.current.y += ball.current.dy;

    gameLoop.current = requestAnimationFrame(draw);
  }, [gameOver, won]);

  useEffect(() => {
    if (!gameOver && !won) {
      gameLoop.current = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(gameLoop.current);
  }, [draw, gameOver, won]);

  return (
    <div style={gameContainerStyle}>
      <div style={{ position: 'absolute', top: 10, left: 10, fontWeight: 'bold' }}>SCORE: {score}</div>
      <button 
        onClick={onExit}
        style={{ position: 'absolute', top: 10, right: 10, background: '#2a3b22', color: '#a3c68c', border: 'none', padding: '5px 10px', cursor: 'pointer', fontFamily: '"Courier New"' }}
      >
        EXIT
      </button>
      
      { (gameOver || won) ? (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#2a3b22' }}>{won ? 'YOU WIN!' : 'GAME OVER'}</h2>
          <p style={{ color: '#2a3b22', marginBottom: 20 }}>SCORE: {score}</p>
          <button 
            onClick={() => {
              // Reset
              let b = [];
              for (let c = 0; c < brickColumnCount; c++) {
                b[c] = [];
                for (let r = 0; r < brickRowCount; r++) {
                  b[c][r] = { x: 0, y: 0, status: 1 };
                }
              }
              bricks.current = b;
              paddleX.current = 120;
              ball.current = { x: 150, y: 250, dx: 3, dy: -3 };
              setScore(0);
              setWon(false);
              setGameOver(false);
            }}
            style={{ background: '#2a3b22', color: '#a3c68c', border: 'none', padding: '10px 20px', cursor: 'pointer', fontFamily: '"Courier New"' }}
          >
            RETRY
          </button>
        </div>
      ) : (
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={300} 
          style={{ border: '2px solid #2a3b22', marginTop: 30 }}
        />
      )}
    </div>
  );
};
