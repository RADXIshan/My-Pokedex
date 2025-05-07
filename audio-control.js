document.addEventListener('DOMContentLoaded', () => {
  const music = document.getElementById('backgroundMusic');
  const audioControl = document.getElementById('audioControl');
  const audioIcon = document.getElementById('audioIcon');
  let isMuted = true;

  // Try to load the saved music time
  const savedTime = localStorage.getItem('music-time');
  if (savedTime) {
    music.currentTime = parseFloat(savedTime);
  }

  // Load mute state from localStorage if available
  const savedMuteState = localStorage.getItem('music-muted');
  if (savedMuteState !== null) {
    isMuted = savedMuteState === 'true';
    music.muted = isMuted;
    updateAudioIcon();
  }

  let musicStarted = false;

  document.body.addEventListener('mouseover', () => {
    if (!musicStarted) {
      music.play().then(() => {
        console.log('Music resumed!');
        musicStarted = true;
      }).catch((error) => {
        console.error('Autoplay prevented or file missing:', error);
      });
    }
  });

  // Audio control button functionality
  audioControl.addEventListener('click', () => {
    isMuted = !isMuted;
    music.muted = isMuted;
    updateAudioIcon();
    
    // Save mute state to localStorage
    localStorage.setItem('music-muted', isMuted.toString());
  });

  function updateAudioIcon() {
    if (isMuted) {
      audioIcon.className = 'fas fa-volume-mute';
    } else {
      audioIcon.className = 'fas fa-volume-up';
    }
  }

  // Save music position when leaving the page
  window.addEventListener('beforeunload', () => {
    localStorage.setItem('music-time', music.currentTime.toString());
  });
});