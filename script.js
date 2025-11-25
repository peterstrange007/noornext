// ---------------------
// Dark Mode Toggle
// ---------------------
const toggleBtn = document.getElementById("toggle-dark");

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
  });
}

// Load saved mode
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark-mode");
}


// ---------------------
// Scroll Animations
// ---------------------
const animatedElements = document.querySelectorAll(".fade-up, .scale-in");

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = "running";
    }
  });
}, { threshold: 0.2 });

animatedElements.forEach(el => observer.observe(el));

// ---------------------
// Mobile menu toggle (robust initialization)
// ---------------------
document.addEventListener('DOMContentLoaded', () => {
  try {
    const menuButtons = document.querySelectorAll('.menu-toggle');
    if (!menuButtons || menuButtons.length === 0) return;

    menuButtons.forEach(btn => {
      // ensure button has explicit type to avoid accidental form submit
      if (!btn.hasAttribute('type')) btn.setAttribute('type', 'button');
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', () => {
        const isOpen = document.body.classList.toggle('nav-open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    });

    // Close menu when a nav link is clicked (mobile)
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
        menuButtons.forEach(b => b.setAttribute('aria-expanded', 'false'));
      });
    });

    // Highlight the current page's nav link and set aria-current
    const setActiveNavLink = () => {
      const links = document.querySelectorAll('nav a');
      let current = location.pathname.split('/').pop();
      if (!current) current = 'index.html';
      current = decodeURIComponent(current);

      links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        try {
          const linkUrl = new URL(href, location.origin);
          const linkFile = decodeURIComponent(linkUrl.pathname.split('/').pop());
          if (linkFile === current) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
          } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
          }
        } catch (e) {
          // fallback: compare raw href filename
          const linkFile = decodeURIComponent(href.split('/').pop());
          if (linkFile === current) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
          } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
          }
        }
      });
    };
    setActiveNavLink();
  } catch (err) {
    // log errors to help debugging in console
    console.error('Mobile menu init error:', err);
  }
});
