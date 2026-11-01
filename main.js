(() => {
  // --- HUD status typing effect ---
  const hudStatus = document.querySelector('.hud-status');
  if (hudStatus) {
    const hudText = 'SYSTEM ONLINE · RESEARCH ACTIVE · NVIDIA GEAR LAB';
    let hudIndex = 0;
    const text = document.createTextNode('');
    const cursor = document.createElement('span');
    cursor.className = 'hud-cursor';
    hudStatus.append(text, cursor);
    const typeNext = () => {
      if (hudIndex < hudText.length) {
        text.data = hudText.slice(0, ++hudIndex);
        setTimeout(typeNext, 40 + Math.random() * 30);
      }
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      text.data = hudText;
    } else {
      setTimeout(typeNext, 1200);
    }
  }

  // --- Active nav highlighting on scroll ---
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  const sections = document.querySelectorAll('section[id]');

  if (sections.length && navLinks.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

    sections.forEach((section) => navObserver.observe(section));
  }

  // --- Scroll-triggered section reveal ---
  const revealSections = document.querySelectorAll('section.reveal');

  if (revealSections.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Stagger topic-items within the revealed section
          const items = entry.target.querySelectorAll('.topic-item');
          items.forEach((item, i) => {
            setTimeout(() => item.classList.add('is-revealed'), 80 + i * 70);
          });
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });

    revealSections.forEach((section) => revealObserver.observe(section));
  }

  // --- Scroll progress bar ---
  const scrollProgress = document.querySelector('.scroll-progress');
  if (scrollProgress) {
    let progressTicking = false;
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
      scrollProgress.style.transform = `scaleX(${ratio})`;
      progressTicking = false;
    };
    window.addEventListener('scroll', () => {
      if (!progressTicking) {
        progressTicking = true;
        requestAnimationFrame(updateProgress);
      }
    }, { passive: true });
    updateProgress();
  }
})();
