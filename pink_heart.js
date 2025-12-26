var settings = {
  particles: {
    length: 500,
    duration: 2,
    velocity: 100,
    effect: -0.75,
    size: 30,
  },
};

(function () {
  let b = 0;
  let c = ["ms", "moz", "webkit", "o"];
  for (var a = 0; a < c.length && !window.requestAnimationFrame; ++a) {
    window.requestAnimationFrame = window[c[a] + "RequestAnimationFrame"];
    window.cancelAnimationFrame =
      window[c[a] + "CancelAnimationFrame"] ||
      window[c[a] + "CancelRequestAnimationFrame"];
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (h, e) {
      let d = new Date().getTime();
      let f = Math.max(0, 16 - (d - b));
      let g = window.setTimeout(function () {
        h(d + f);
      }, f);
      b = d + f;
      return g;
    };
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (d) {
      clearTimeout(d);
    };
  }
})();

/*
 * Point class
 */
var Point = (function () {
  function Point(x, y) {
    this.x = typeof x !== "undefined" ? x : 0;
    this.y = typeof y !== "undefined" ? y : 0;
  }
  Point.prototype.clone = function () {
    return new Point(this.x, this.y);
  };
  Point.prototype.length = function (length) {
    if (typeof length == "undefined")
      return Math.sqrt(this.x * this.x + this.y * this.y);
    this.normalize();
    this.x *= length;
    this.y *= length;
    return this;
  };
  Point.prototype.normalize = function () {
    var length = this.length();
    this.x /= length;
    this.y /= length;
    return this;
  };
  return Point;
})();

/*
 * Particle class
 */
var Particle = (function () {
  function Particle() {
    this.position = new Point();
    this.velocity = new Point();
    this.acceleration = new Point();
    this.age = 0;
  }
  Particle.prototype.initialize = function (x, y, dx, dy) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = dx;
    this.velocity.y = dy;
    this.acceleration.x = dx * settings.particles.effect;
    this.acceleration.y = dy * settings.particles.effect;
    this.age = 0;
  };
  Particle.prototype.update = function (deltaTime) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.age += deltaTime;
  };
  Particle.prototype.draw = function (context, image) {
    function ease(t) {
      return --t * t * t + 1;
    }
    var size = image.width * ease(this.age / settings.particles.duration);
    context.globalAlpha = 1 - this.age / settings.particles.duration;
    context.drawImage(
      image,
      this.position.x - size / 2,
      this.position.y - size / 2,
      size,
      size
    );
  };
  return Particle;
})();

/*
 * ParticlePool class
 */
var ParticlePool = (function () {
  var particles,
    firstActive = 0,
    firstFree = 0,
    duration = settings.particles.duration;

  function ParticlePool(length) {
    // create and populate particle pool
    particles = new Array(length);
    for (var i = 0; i < particles.length; i++) particles[i] = new Particle();
  }
  ParticlePool.prototype.add = function (x, y, dx, dy) {
    particles[firstFree].initialize(x, y, dx, dy);

    // handle circular queue
    firstFree++;
    if (firstFree == particles.length) firstFree = 0;
    if (firstActive == firstFree) firstActive++;
    if (firstActive == particles.length) firstActive = 0;
  };
  ParticlePool.prototype.update = function (deltaTime) {
    var i;

    // update active particles
    if (firstActive < firstFree) {
      for (i = firstActive; i < firstFree; i++) particles[i].update(deltaTime);
    }
    if (firstFree < firstActive) {
      for (i = firstActive; i < particles.length; i++)
        particles[i].update(deltaTime);
      for (i = 0; i < firstFree; i++) particles[i].update(deltaTime);
    }

    // remove inactive particles
    while (particles[firstActive].age >= duration && firstActive != firstFree) {
      firstActive++;
      if (firstActive == particles.length) firstActive = 0;
    }
  };
  ParticlePool.prototype.draw = function (context, image) {
    // draw active particles
    if (firstActive < firstFree) {
      for (i = firstActive; i < firstFree; i++)
        particles[i].draw(context, image);
    }
    if (firstFree < firstActive) {
      for (i = firstActive; i < particles.length; i++)
        particles[i].draw(context, image);
      for (i = 0; i < firstFree; i++) particles[i].draw(context, image);
    }
  };
  return ParticlePool;
})();

/*
 * Putting it all together
 */
(function (canvas) {
  var context = canvas.getContext("2d"),
    particles = new ParticlePool(settings.particles.length),
    particleRate = settings.particles.length / settings.particles.duration, // particles/sec
    time;

  // get point on heart with -PI <= t <= PI
  function pointOnHeart(t) {
    return new Point(
      160 * Math.pow(Math.sin(t), 3),
      130 * Math.cos(t) -
        50 * Math.cos(2 * t) -
        20 * Math.cos(3 * t) -
        10 * Math.cos(4 * t) +
        25
    );
  }

  // creating the particle image using a dummy canvas
  var image = (function () {
    var canvas = document.createElement("canvas"),
      context = canvas.getContext("2d");
    canvas.width = settings.particles.size;
    canvas.height = settings.particles.size;
    // helper function to create the path
    function to(t) {
      var point = pointOnHeart(t);
      point.x =
        settings.particles.size / 2 + (point.x * settings.particles.size) / 350;
      point.y =
        settings.particles.size / 2 - (point.y * settings.particles.size) / 350;
      return point;
    }
    // create the path
    context.beginPath();
    var t = -Math.PI;
    var point = to(t);
    context.moveTo(point.x, point.y);
    while (t < Math.PI) {
      t += 0.01; // baby steps!
      point = to(t);
      context.lineTo(point.x, point.y);
    }
    context.closePath();
    // create the fill
    context.fillStyle = "#ea80b0";
    context.fill();
    // create the image
    var image = new Image();
    image.src = canvas.toDataURL();
    return image;
  })();

  // render that thing!
  function render() {
    // next animation frame
    requestAnimationFrame(render);

    // update time
    var newTime = new Date().getTime() / 1000,
      deltaTime = newTime - (time || newTime);
    time = newTime;

    // clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // create new particles
    var amount = particleRate * deltaTime;
    for (var i = 0; i < amount; i++) {
      var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
      var dir = pos.clone().length(settings.particles.velocity);
      particles.add(
        canvas.width / 2 + pos.x,
        canvas.height / 2 - pos.y,
        dir.x,
        -dir.y
      );
    }

    particles.update(deltaTime);
    particles.draw(context, image);
  }

  function onResize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.onresize = onResize;

  setTimeout(function () {
    onResize();
    render();
  }, 10);
})(document.getElementById("pinkboard"));

/*
 * Neon Background Hearts Animation
 */
(function () {
  const neonBackground = document.getElementById("neonBackground");
  
  function createNeonHeart() {
    const heart = document.createElement("div");
    heart.className = "neon-heart";
    heart.textContent = "❤";
    
    // Random horizontal position
    const randomX = Math.random() * 100;
    heart.style.left = randomX + "%";
    
    // Random animation duration between 6-10 seconds
    const duration = 6 + Math.random() * 4;
    heart.style.animationDuration = duration + "s";
    
    neonBackground.appendChild(heart);
    
    // Remove the element after animation ends
    setTimeout(() => {
      heart.remove();
    }, duration * 1000);
  }
  
  // Create new hearts every 300ms
  setInterval(createNeonHeart, 300);
})();

/*
 * Fabiana Name & Heart Transition Animation
 */
(function () {
  const canvas = document.getElementById("pinkboard");
  const fabianaContainer = document.getElementById("fabianaContainer");
  const fabianaName = document.getElementById("fabianaName");
  
  let showingHeart = true;
  const transitionInterval = 5000; // Switch every 5 seconds
  
  // Create decorative hearts around the name
  function createDecorativeHearts() {
    const positions = [
      { top: '-20px', left: '-40px', delay: '0s' },
      { top: '-20px', right: '-40px', delay: '0.3s' },
      { bottom: '-20px', left: '-40px', delay: '0.6s' },
      { bottom: '-20px', right: '-40px', delay: '0.9s' },
      { top: '50%', left: '-60px', delay: '0.2s' },
      { top: '50%', right: '-60px', delay: '0.5s' },
    ];
    
    positions.forEach(pos => {
      const heart = document.createElement('span');
      heart.className = 'heart-decoration';
      heart.textContent = '♥';
      heart.style.animationDelay = pos.delay;
      
      if (pos.top) heart.style.top = pos.top;
      if (pos.bottom) heart.style.bottom = pos.bottom;
      if (pos.left) heart.style.left = pos.left;
      if (pos.right) heart.style.right = pos.right;
      
      fabianaName.appendChild(heart);
    });
  }
  
  // Apply the beautiful font
  fabianaName.style.fontFamily = "'Great Vibes', 'Pacifico', cursive";
  
  createDecorativeHearts();
  
  function toggleDisplay() {
    if (showingHeart) {
      // Transition: Heart contracts -> Name expands
      canvas.classList.add('hidden');
      
      setTimeout(() => {
        fabianaContainer.classList.remove('hidden');
        fabianaContainer.classList.add('visible');
      }, 400);
      
    } else {
      // Transition: Name contracts -> Heart expands
      fabianaContainer.classList.remove('visible');
      fabianaContainer.classList.add('hidden');
      
      setTimeout(() => {
        canvas.classList.remove('hidden');
      }, 400);
    }
    
    showingHeart = !showingHeart;
  }
  
  // Start the transition loop after initial delay
  setTimeout(() => {
    toggleDisplay();
    setInterval(toggleDisplay, transitionInterval);
  }, 3000); // First transition after 3 seconds
})();

/*
 * Lyrics Display System
 */
(function () {
  let lyrics = [];
  let currentLyricIndex = 0;
  const audioPlayer = document.getElementById("audioPlayer");
  const lyricLine = document.getElementById("lyricLine");
  
  // Load lyrics from file
  async function loadLyrics() {
    try {
      const response = await fetch("lyrics.txt");
      const text = await response.text();
      
      // Parse lyrics file format: time|lyric_text
      lyrics = text.split("\n")
        .filter(line => line.trim())
        .map(line => {
          const [timeStr, lyricText] = line.split("|");
          const timeParts = timeStr.split(":");
          const timeInSeconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
          return { time: timeInSeconds, text: lyricText.trim() };
        });
      
      console.log(`Loaded ${lyrics.length} lyric lines`);
    } catch (error) {
      console.log("lyrics.txt not found. Make sure to create it with the lyric timestamps.");
    }
  }
  
  // Update lyrics based on current audio time
  function updateLyrics() {
    if (lyrics.length === 0) return;
    
    const currentTime = audioPlayer.currentTime;
    
    // Find the current lyric
    for (let i = 0; i < lyrics.length; i++) {
      const current = lyrics[i];
      const next = lyrics[i + 1];
      
      if (currentTime >= current.time && (!next || currentTime < next.time)) {
        if (i !== currentLyricIndex) {
          currentLyricIndex = i;
          lyricLine.textContent = current.text;
          lyricLine.style.animation = "none";
          // Trigger reflow to restart animation
          void lyricLine.offsetWidth;
          lyricLine.style.animation = "fade-in-out 4s ease-in-out forwards";
        }
        break;
      }
    }
  }
  
  // Update lyrics on audio play
  audioPlayer.addEventListener("play", () => {
    loadLyrics();
    const lyricsUpdateInterval = setInterval(() => {
      if (audioPlayer.paused) {
        clearInterval(lyricsUpdateInterval);
      } else {
        updateLyrics();
      }
    }, 100);
  });
})();
