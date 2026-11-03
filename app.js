(() => {
  const content = window.softseerContent;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.querySelector(".particle-canvas");
  const context = canvas.getContext("2d", { alpha: true });
  const hero = document.querySelector(".hero");
  const intro = document.querySelector("#about");
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".primary-nav");
  const services = content.services;
  const projects = content.projects;
  const serviceList = document.querySelector(".service-list");
  const projectDots = document.querySelector(".project-dots");
  const projectName = document.querySelector("#project-name");
  const projectCategory = document.querySelector("#project-category");
  const projectCounter = document.querySelector("#project-counter");
  const projectDescription = document.querySelector("#project-description");
  const form = document.querySelector(".contact-form");
  const formStatus = document.querySelector(".form-status");
  let activeService = 0;
  let activeProject = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let backgroundStars = [];
  let robotTargets = null;
  let screenPositions = new Float32Array(0);
  let animationFrame = 0;
  let startedAt = performance.now();
  let pointer = { x: -1000, y: -1000 };
  let pageVisible = !document.hidden;
  let heroVisible = false;
  let isVisible = false;
  let robotJourneyActive = false;
  let robotJourneyProgress = 0;

  document.querySelector("#year").textContent = new Date().getFullYear();

  function renderServices() {
    serviceList.innerHTML = services.map((service, index) => `
      <button class="service-tab${index === activeService ? " is-active" : ""}" type="button"
        role="tab" id="service-tab-${index}" aria-selected="${index === activeService}"
        aria-controls="service-panel" tabindex="${index === activeService ? "0" : "-1"}" data-service="${index}">
        <span class="service-index">0${index + 1}</span><span>${service.name}</span><span class="service-arrow" aria-hidden="true">↗</span>
      </button>`).join("");
    const active = services[activeService];
    document.querySelector("#service-number").textContent = `SERVICE / 0${activeService + 1}`;
    document.querySelector("#service-name").textContent = active.name;
    document.querySelector("#service-copy").textContent = active.description;
    document.querySelector(".service-detail").setAttribute("aria-labelledby", `service-tab-${activeService}`);
    serviceList.querySelectorAll(".service-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        activeService = Number(tab.dataset.service);
        renderServices();
      });
      tab.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        activeService = (activeService + direction + services.length) % services.length;
        renderServices();
        serviceList.querySelector(`[data-service="${activeService}"]`).focus();
      });
    });
  }

  function renderProjectDots() {
    projectDots.innerHTML = projects.map((project, index) => `
      <button type="button" class="project-dot${index === activeProject ? " is-active" : ""}"
        aria-label="Show ${project.name}" aria-pressed="${index === activeProject}" data-project="${index}"></button>
    `).join("");
    projectDots.querySelectorAll(".project-dot").forEach((dot) => {
      dot.addEventListener("click", () => showProject(Number(dot.dataset.project)));
    });
  }

  function showProject(index) {
    activeProject = (index + projects.length) % projects.length;
    const project = projects[activeProject];
    projectName.textContent = project.name;
    projectCategory.textContent = project.category;
    projectCounter.textContent = `0${activeProject + 1} — 0${projects.length}`;
    projectDescription.textContent = "Portfolio entry listed in the supplied company brief. Description, category, approved media, technologies, and live URL are awaiting confirmation.";
    document.querySelector(".project-visual").style.setProperty("--project-hue", `${174 + activeProject * 3}deg`);
    renderProjectDots();
  }

  renderServices();
  showProject(0);
  document.querySelector(".project-prev").addEventListener("click", () => showProject(activeProject - 1));
  document.querySelector(".project-next").addEventListener("click", () => showProject(activeProject + 1));

  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("is-open", !expanded);
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  }));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));

  function updateHeaderVisibility() {
    const showHeader = window.scrollY > Math.min(140, window.innerHeight * 0.35);
    document.body.classList.toggle("has-scrolled", showHeader);
    header.inert = !showHeader;
  }
  window.addEventListener("scroll", updateHeaderVisibility, { passive: true });
  updateHeaderVisibility();

  function updateFormStatus(message, state) {
    formStatus.textContent = message;
    formStatus.dataset.state = state;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!content.contactEndpoint) {
      updateFormStatus("This enquiry form is not connected yet. Please add SoftSeer's verified form endpoint to content.js before using it.", "error");
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    updateFormStatus("Sending your enquiry…", "pending");
    try {
      const response = await fetch(content.contactEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      if (!response.ok) throw new Error(`Contact service returned ${response.status}`);
      form.reset();
      updateFormStatus("Your enquiry has been sent.", "success");
    } catch (error) {
      updateFormStatus(`Your enquiry could not be sent. ${error.message}`, "error");
    } finally {
      submit.disabled = false;
    }
  });

  const random = (min, max) => min + Math.random() * (max - min);
  const smoothstep = (value) => {
    const clamped = Math.max(0, Math.min(1, value));
    return clamped * clamped * (3 - 2 * clamped);
  };
  function updateRobotJourney() {
    const scrollY = window.scrollY;
    robotJourneyProgress = reducedMotion ? 0 : smoothstep(scrollY / Math.max(height, 1));
    const journeyEnd = intro.offsetTop + intro.offsetHeight;
    robotJourneyActive = !reducedMotion && scrollY > 0 && scrollY < journeyEnd;
    document.body.classList.toggle("robot-journey-active", robotJourneyActive);
    isVisible = pageVisible && (heroVisible || robotJourneyActive);
    if (isVisible && !animationFrame) animationFrame = requestAnimationFrame(renderFrame);
    if (!isVisible && animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  }
  const formationDuration = 5200;
  const randomOutsideViewport = () => {
    const side = Math.floor(Math.random() * 4);
    const alongEdge = random(-0.15, 1.15);
    const distance = random(0.1, 0.35);
    if (side === 0) return { x: alongEdge, y: -distance };
    if (side === 1) return { x: 1 + distance, y: alongEdge };
    if (side === 2) return { x: alongEdge, y: 1 + distance };
    return { x: -distance, y: alongEdge };
  };

  function resizeCanvas() {
    const bounds = hero.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
    updateRobotJourney();
  }

  function createParticles() {
    const sourceWidth = 522;
    const sourceHeight = 723;
    backgroundStars = Array.from({ length: 2155 }, () => {
      const start = randomOutsideViewport();
      return {
        startX: start.x,
        startY: start.y,
        targetX: Math.random(),
        targetY: Math.random(),
        size: random(0.35, 1.05),
        brightness: Math.floor(random(0, 3)),
        phase: random(0, Math.PI * 2),
        spiralTurns: random(0.65, 1.15),
        spiralDirection: Math.random() < 0.5 ? -1 : 1
      };
    });
    if (!robotTargets) {
      particles = [];
      return;
    }
    particles = robotTargets.map(([x, y, glow, size, r, g, b]) => {
      const target = { x: x / 10000, y: y / 10000, z: 0 };
      const sourceX = (target.x / (2 * sourceWidth / sourceHeight) + 0.5) * sourceWidth;
      const sourceY = (0.5 - target.y / 2) * sourceHeight;
      const edgeFade = smoothstep((sourceX - 22) / 55)
        * smoothstep((500 - sourceX) / 55)
        * smoothstep((sourceY - 18) / 38)
        * smoothstep((705 - sourceY) / 38);
      return {
        x: target.x,
        y: target.y,
        z: target.z,
        startX: target.x,
        startY: target.y,
        startZ: target.z,
        target,
        size: size / 1000,
        glow: glow / 255,
        r,
        g,
        b,
        edgeFade,
        phase: random(0, 7),
        spiralTurns: random(0.85, 1.2),
        spiralDirection: Math.random() < 0.5 ? -1 : 1
      };
    });
    screenPositions = new Float32Array(particles.length * 3);
  }

  function scatterParticles() {
    const scale = Math.min(width * 0.47, height * 0.47);
    for (const star of backgroundStars) {
      const start = reducedMotion ? { x: star.targetX, y: star.targetY } : randomOutsideViewport();
      star.startX = start.x;
      star.startY = start.y;
    }
    for (const particle of particles) {
      if (reducedMotion) {
        particle.x = particle.target.x;
        particle.y = particle.target.y;
        particle.z = particle.target.z;
      } else {
        const start = randomOutsideViewport();
        particle.x = (start.x - 0.5) * width / scale;
        particle.y = (0.52 - start.y) * height / scale;
        particle.z = random(-0.2, 0.2);
      }
      particle.startX = particle.x;
      particle.startY = particle.y;
      particle.startZ = particle.z;
    }
    startedAt = performance.now();
  }

  function renderFrame(now) {
    animationFrame = 0;
    if (!isVisible) return;
    const elapsed = now / 1000;
    const formationProgress = reducedMotion ? 1 : Math.min(1, (now - startedAt) / formationDuration);
    const formationEase = formationProgress < 0.5
      ? 2 * formationProgress ** 2
      : 1 - ((-2 * formationProgress + 2) ** 2) / 2;
    hero.style.setProperty("--particle-formation", formationEase);
    context.clearRect(0, 0, width, height);
    const scale = Math.min(width * 0.47, height * 0.47);
    const centerX = width * 0.5;
    const centerY = height * 0.52;
    const journeyProgress = robotJourneyProgress;

    const glowGradient = context.createRadialGradient(
      centerX,
      centerY,
      12,
      centerX,
      centerY,
      scale * 1.8
    );
    glowGradient.addColorStop(0, "rgba(28, 91, 190, 0.14)");
    glowGradient.addColorStop(0.45, "rgba(18, 58, 135, 0.08)");
    glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.globalAlpha = formationEase * (1 - journeyProgress);
    context.fillStyle = glowGradient;
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 1;

    for (let brightness = 0; brightness < 3; brightness += 1) {
      context.beginPath();
      for (const star of backgroundStars) {
        if (star.brightness !== brightness) continue;
        const remaining = 1 - formationEase;
        const angle = formationEase * star.spiralTurns * Math.PI * 2 * star.spiralDirection;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const startX = (star.startX - 0.5) * width;
        const startY = (star.startY - 0.5) * height;
        const spiralX = startX * cos - startY * sin;
        const spiralY = startX * sin + startY * cos;
        const drift = formationProgress === 1 ? 1 : 0;
        const x = centerX + spiralX * remaining + (star.targetX - 0.5) * width * formationEase
          + Math.sin(elapsed * 0.16 + star.phase) * 1.5 * drift;
        const y = centerY + spiralY * remaining + (star.targetY - 0.5) * height * formationEase
          + Math.cos(elapsed * 0.13 + star.phase) * 1.5 * drift;
        context.moveTo(x + star.size, y);
        context.arc(x, y,
          star.size, 0, Math.PI * 2);
      }
      context.globalAlpha = formationEase * (1 - journeyProgress)
        * (0.18 + brightness * 0.17)
        * (0.85 + Math.sin(elapsed * 1.3 + brightness) * 0.15);
      context.fillStyle = "#b9d8ff";
      context.fill();
    }
    context.globalAlpha = 1;

    const tilt = -7 * journeyProgress * Math.PI / 180;
    const tiltCos = Math.cos(tilt);
    const tiltSin = Math.sin(tilt);
    const journeyScale = 1 - journeyProgress * 0.1;
    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const target = particle.target;
      const drift = formationProgress === 1 ? 1 : 0;
      const remaining = 1 - formationEase;
      const angle = formationEase * particle.spiralTurns * Math.PI * 2 * particle.spiralDirection;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const spiralX = particle.startX * cos - particle.startY * sin;
      const spiralY = particle.startX * sin + particle.startY * cos;
      particle.x = spiralX * remaining + target.x * formationEase
        + Math.sin(elapsed * 0.4 + particle.phase) * 0.00012 * drift;
      particle.y = spiralY * remaining + target.y * formationEase
        + Math.cos(elapsed * 0.35 + particle.phase) * 0.0001 * drift;
      particle.z = particle.startZ + (target.z - particle.startZ) * formationEase;
      const perspective = 1.2 / (1.2 + particle.z * 0.15);
      const px = centerX + particle.x * scale * perspective;
      const py = centerY - particle.y * scale * perspective;
      const dx = px - pointer.x;
      const dy = py - pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      let repel = 0;
      if (distance < 90) repel = (1 - distance / 90) * 12;
      const relativeX = (px + (distance ? dx / distance * repel : 0) - centerX) * journeyScale;
      const relativeY = (py + (distance ? dy / distance * repel : 0) - centerY) * journeyScale;
      const position = index * 3;
      screenPositions[position] = centerX + relativeX * tiltCos - relativeY * tiltSin
        + width * 0.24 * journeyProgress;
      screenPositions[position + 1] = centerY + relativeX * tiltSin + relativeY * tiltCos;
      screenPositions[position + 2] = (0.55 + particle.size * 0.48) * perspective * journeyScale;
    }

    const journeyEnd = intro.offsetTop + intro.offsetHeight;
    const exitFadeDistance = Math.min(180, height * 0.35);
    const exitProgress = smoothstep((window.scrollY - (journeyEnd - exitFadeDistance)) / exitFadeDistance);
    const narrowScreenFade = width < 700 ? smoothstep(journeyProgress * 1.5) : 0;
    context.globalAlpha = formationEase * (1 - exitProgress) * (1 - narrowScreenFade);
    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const position = index * 3;
      const x = screenPositions[position];
      const y = screenPositions[position + 1];
      const radius = screenPositions[position + 2];
      const intensity = particle.glow * (0.9 + Math.sin(elapsed * 1.5 + particle.phase) * 0.08);
      const red = Math.min(255, Math.round(particle.r * 1.45 + 28));
      const green = Math.min(255, Math.round(particle.g * 1.4 + 30));
      const blue = Math.min(255, Math.round(particle.b * 1.3 + 45));
      const alpha = (0.56 + intensity * 0.36) * particle.edgeFade;
      if (intensity > 0.72) {
        context.beginPath();
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${(0.035 + (intensity - 0.72) * 0.12) * particle.edgeFade})`;
        context.arc(x, y, radius * 3.2, 0, Math.PI * 2);
        context.fill();
      }
      context.beginPath();
      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    animationFrame = requestAnimationFrame(renderFrame);
  }

  if (context) {
    canvas.addEventListener("pointermove", (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    });
    canvas.addEventListener("pointerleave", () => { pointer = { x: -1000, y: -1000 }; });
    document.addEventListener("visibilitychange", () => {
      pageVisible = !document.hidden;
      updateRobotJourney();
    });
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("scroll", updateRobotJourney, { passive: true });
    resizeCanvas();
    fetch("/robot-points.json?v=4", { cache: "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Robot particle data returned ${response.status}`);
        return response.json();
      })
      .then((targets) => {
        if (!Array.isArray(targets) || targets.length === 0
          || !targets.every((point) => Array.isArray(point) && point.length === 7 && point.every(Number.isFinite))) {
          throw new Error("Robot particle data is empty or invalid");
        }
        robotTargets = targets;
        createParticles();
        if (heroVisible) scatterParticles();
      })
      .catch((error) => console.error("Could not load the robot particle artwork.", error));
    const heroObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const entering = entry.isIntersecting && !heroVisible;
        heroVisible = entry.isIntersecting;
        if (entering) scatterParticles();
        updateRobotJourney();
      }
    }, { threshold: 0.15 });
    heroObserver.observe(hero);
  } else {
    hero.classList.add("intro-complete");
  }
})();
