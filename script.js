(function () {
  const endpoint = (type) => `backend/form-handler.php?type=${encodeURIComponent(type)}`;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const showMessage = (node, text, state = "") => {
    if (!node) return;
    node.textContent = text;
    node.className = state ? `form-message ${state}` : "form-message";
  };

  const submitForm = async ({ type, form, messageNode, extra = {}, requireFile = false }) => {
    const fd = new FormData(form);
    Object.entries(extra).forEach(([key, value]) => fd.set(key, value || ""));

    const email = String(fd.get("email") || "").trim();
    if (!emailPattern.test(email)) {
      showMessage(messageNode, "Please enter a valid email address.", "error");
      return;
    }

    const file = form.querySelector('input[type="file"]')?.files?.[0];
    if (requireFile && !file) {
      showMessage(messageNode, "Please upload your resume as a PDF.", "error");
      return;
    }
    if (file) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        showMessage(messageNode, "Resume must be a PDF file.", "error");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showMessage(messageNode, "Resume must be smaller than 10 MB.", "error");
        return;
      }
    }

    try {
      showMessage(messageNode, "Submitting...", "pending");
      const res = await fetch(endpoint(type), { method: "POST", body: fd });
      const json = await res.json().catch(() => null);
      const text = (json && (json.message || json.error)) || "Submission failed. Please try again.";
      if (!res.ok || !json || json.success === false) {
        showMessage(messageNode, text, "error");
        return;
      }
      showMessage(messageNode, text, "success");
      form.reset();
    } catch (error) {
      console.error(error);
      showMessage(messageNode, "Submission failed. Please check your connection and try again.", "error");
    }
  };

  const initTheme = () => {
    const toggle = document.getElementById("toggle-dark");
    if (localStorage.getItem("darkMode") === "true") {
      document.body.classList.add("dark-mode");
    }
    if (!toggle) return;
    toggle.type = "button";
    const syncLabel = () => {
      toggle.textContent = document.body.classList.contains("dark-mode") ? "Light Mode" : "Dark Mode";
    };
    syncLabel();
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem("darkMode", String(document.body.classList.contains("dark-mode")));
      syncLabel();
    });
  };

  const initNavigation = () => {
    const menuButtons = document.querySelectorAll(".menu-toggle");
    menuButtons.forEach((button) => {
      button.type = "button";
      button.setAttribute("aria-expanded", "false");
      button.addEventListener("click", () => {
        const isOpen = document.body.classList.toggle("nav-open");
        button.setAttribute("aria-expanded", String(isOpen));
      });
    });

    document.querySelectorAll("nav a").forEach((link) => {
      const current = decodeURIComponent(location.pathname.split("/").pop() || "index.html");
      const target = decodeURIComponent((link.getAttribute("href") || "").split("/").pop());
      if (target === current) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
      link.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        menuButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
      });
    });
  };

  const initRevealAnimations = () => {
    const elements = document.querySelectorAll(".section, .card, .feature-card, .job-card, .updates-panel");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    elements.forEach((element) => {
      element.classList.add("reveal");
      observer.observe(element);
    });
  };

  const loadJson = async (path) => {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
  };

  const renderJobs = async () => {
    const container = document.getElementById("jobs-list");
    if (!container) return;

    try {
      const jobs = await loadJson("jobs.json");
      if (!Array.isArray(jobs) || jobs.length === 0) {
        container.innerHTML = '<p class="empty-state">No open positions at the moment.</p>';
        return;
      }
      container.innerHTML = jobs
        .map(
          (job, index) => `
            <article class="job-card">
              <div>
                <h3>${escapeHtml(job.title)}</h3>
                <p class="job-meta">${escapeHtml(job.location)} &middot; ${escapeHtml(job.type)}</p>
              </div>
              <p>${escapeHtml(job.summary)}</p>
              <a class="btn" href="job.html?id=${index}">Apply Now</a>
            </article>
          `
        )
        .join("");
    } catch (error) {
      console.error(error);
      container.innerHTML = '<p class="empty-state">Unable to load open positions right now.</p>';
    }
  };

  const renderInternships = async () => {
    const container = document.getElementById("internships-list");
    if (!container) return;

    try {
      const internships = await loadJson("internships.json");
      if (!Array.isArray(internships) || internships.length === 0) {
        container.innerHTML = '<p class="empty-state">No internships available at the moment.</p>';
        return;
      }
      container.innerHTML = internships
        .map((item, index) => {
          const detailId = Number.isInteger(Number(item.id)) ? item.id : index;
          const meta = [item.location, item.type, item.duration].filter(Boolean).map(escapeHtml).join(" &middot; ");
          return `
            <article class="job-card">
              <div>
                <h3>${escapeHtml(item.title)}</h3>
                ${item.ideal_for ? `<p class="job-meta">Ideal for: ${escapeHtml(item.ideal_for)}</p>` : ""}
                <p class="job-meta">${meta}</p>
              </div>
              <p>${escapeHtml(item.description || item.summary || "")}</p>
              <a class="btn" href="internship-detail.html?id=${detailId}">Apply Now</a>
            </article>
          `;
        })
        .join("");
    } catch (error) {
      console.error(error);
      container.innerHTML = '<p class="empty-state">Unable to load internships right now.</p>';
    }
  };

  const initStaticForms = () => {
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
      contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!contactForm.checkValidity()) {
          contactForm.reportValidity();
          return;
        }
        submitForm({
          type: "contact",
          form: contactForm,
          messageNode: document.getElementById("contact-response"),
        });
      });
    }

    const collabForm = document.getElementById("collab-form");
    if (collabForm) {
      collabForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!collabForm.checkValidity()) {
          collabForm.reportValidity();
          return;
        }
        submitForm({
          type: "collaboration",
          form: collabForm,
          messageNode: document.getElementById("collab-message"),
        });
      });
    }
  };

  window.NoorNext = {
    escapeHtml,
    loadJson,
    submitForm,
  };

  document.addEventListener("DOMContentLoaded", async () => {
    initTheme();
    initNavigation();
    initStaticForms();
    await Promise.all([renderJobs(), renderInternships()]);
    initRevealAnimations();
  });
})();
