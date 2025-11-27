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

    // Jobs loader: try fetching external jobs.json, fallback to inline #jobs-data
    const loadJobs = async () => {
      // try fetch first (works when served over HTTP)
      try {
        const res = await fetch('jobs.json', { cache: 'no-store' });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        // ignore and fallback to inline
      }

      // fallback: inline JSON in page
      const jobsScript = document.getElementById('jobs-data');
      if (jobsScript) {
        try { return JSON.parse(jobsScript.textContent || '[]'); } catch (e) { return []; }
      }
      return [];
    };

    // Renderer with simple pagination
    const renderJobsPaged = async ({ perPage = 6 } = {}) => {
      const jobs = await loadJobs();
      const container = document.getElementById('jobs-list');
      if (!container) return;

      let page = 1;
      const totalPages = Math.max(1, Math.ceil(jobs.length / perPage));

      const jobToHtml = (job, idx) => {
        const safe = s => (s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        // link to job detail page
        const detailUrl = `job.html?id=${idx}`;
        return `\n<div class="card job-card">\n  <h3>${safe(job.title)}</h3>\n  <div class="job-meta">${safe(job.location)} • ${safe(job.type)}</div>\n  <p class="job-summary">${safe(job.summary)}</p>\n  <div class="job-actions">\n    <a class="btn" href="${detailUrl}" target="_self" rel="noopener">Apply</a>\n  </div>\n</div>`;
      };

      const renderPage = p => {
        const start = (p-1)*perPage;
        const slice = jobs.slice(start, start + perPage);
        if (slice.length === 0) container.innerHTML = '<p>No open positions at the moment.</p>';
        else container.innerHTML = slice.map((job,i) => jobToHtml(job, start + i)).join('\n');

        // pager
        let pager = document.getElementById('jobs-pager');
        if (!pager) {
          pager = document.createElement('div');
          pager.id = 'jobs-pager';
          pager.style.marginTop = '16px';
          container.parentNode.insertBefore(pager, container.nextSibling);
        }
        pager.innerHTML = ` <button ${p<=1? 'disabled': ''} data-action="prev">Prev</button> <span> ${p} / ${totalPages} </span> <button ${p>=totalPages? 'disabled': ''} data-action="next">Next</button>`;
        pager.querySelector('[data-action=prev]').onclick = () => { if (page>1) { page--; renderPage(page); } };
        pager.querySelector('[data-action=next]').onclick = () => { if (page<totalPages) { page++; renderPage(page); } };
      };

      renderPage(page);
    };

    // Only run jobs renderer on pages that include #jobs-list
    renderJobsPaged({ perPage: 6 });

    // Ensure updates panel height matches left column exactly (fix visual mismatch)
    const adjustUpdatesPanel = () => {
      try {
        const main = document.querySelector('.updates-main');
        const panel = document.querySelector('.updates-panel');
        if (!main || !panel) return;
        // compute height of left column including gaps
        const height = main.getBoundingClientRect().height;
        panel.style.height = `${Math.ceil(height)}px`;
      } catch (e) {
        // ignore
      }
    };
    // run on load and resize (debounced)
    let _resizeTimer = null;
    adjustUpdatesPanel();
    window.addEventListener('resize', () => {
      clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(adjustUpdatesPanel, 120);
    });

  } catch (err) {
    // log errors to help debugging in console
    console.error('Mobile menu init error:', err);
  }
});
