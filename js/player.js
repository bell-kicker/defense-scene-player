(function () {
  "use strict";

  const state = {
    manifest: null,
    activeId: null,
    token: 0,
    playing: false,
    resume: null,
  };

  const stageVideo = document.getElementById("stage-video");
  const stageVersion = document.getElementById("stage-version");
  const grid = document.getElementById("grid");
  const notice = document.getElementById("notice");
  const resumeBtn = document.getElementById("resume");

  stageVideo.playsInline = true;
  stageVideo.setAttribute("playsinline", "");

  function scenes() {
    return (state.manifest && state.manifest.scenes) || [];
  }

  function sceneById(id) {
    return scenes().find((s) => s.id === id) || null;
  }

  function defaultVersion(scene) {
    return scene && scene.versions && scene.versions[0] ? scene.versions[0] : null;
  }

  function selectedVersion(scene, select) {
    if (!scene || !scene.versions || !scene.versions.length) return null;
    const id = select && select.value;
    return scene.versions.find((v) => v.id === id) || scene.versions[0];
  }

  function setNotice(text) {
    notice.textContent = text || "";
  }

  function fmtTarget(scene) {
    return scene.duration ? scene.duration + "초" : "";
  }

  function applyToVideo(video, version) {
    if (!version) return;
    const next = version.src;
    const poster = version.poster || "";
    if (video.getAttribute("data-src") === next) {
      if (poster) video.poster = poster;
      return;
    }
    video.pause();
    video.poster = poster;
    video.setAttribute("data-src", next);
    video.src = next;
    video.load();
  }

  function pauseAll(except) {
    document.querySelectorAll("video").forEach((video) => {
      if (video !== except) video.pause();
    });
  }

  function fillSelect(select, scene) {
    select.replaceChildren();
    if (!scene || scene.status !== "ok" || !scene.versions.length) {
      const opt = document.createElement("option");
      opt.textContent = "영상 준비 중";
      select.append(opt);
      select.disabled = true;
      return;
    }
    select.disabled = false;
    scene.versions.forEach((version, index) => {
      const opt = document.createElement("option");
      opt.value = version.id;
      opt.textContent = version.label;
      if (index === 0) opt.selected = true;
      select.append(opt);
    });
  }

  function renderStage(scene) {
    if (!scene) return;
    state.activeId = scene.id;
    document.getElementById("stage-id").textContent = scene.id;
    document.getElementById("stage-part").textContent = scene.part || "";
    document.getElementById("stage-desc").textContent = scene.description || "";
    document.getElementById("stage-camera").textContent = scene.camera || "";
    fillSelect(stageVersion, scene);
    const version = selectedVersion(scene, stageVersion);
    stageVideo.setAttribute("aria-label", scene.id + " " + (scene.description || ""));
    if (version) applyToVideo(stageVideo, version);
    else {
      stageVideo.removeAttribute("src");
      stageVideo.removeAttribute("data-src");
      stageVideo.poster = "";
      stageVideo.load();
    }
    document.querySelectorAll(".card").forEach((card) => {
      card.classList.toggle("is-active", card.dataset.scene === scene.id);
    });
  }

  function bindCard(card, scene) {
    const video = card.querySelector("video");
    const select = card.querySelector("select");
    if (select) {
      select.addEventListener("change", () => {
        const version = selectedVersion(scene, select);
        if (video && version) applyToVideo(video, version);
        if (state.activeId === scene.id) {
          stageVersion.value = select.value;
          if (version) applyToVideo(stageVideo, version);
        }
      });
    }
    if (!video) return;
    video.addEventListener("play", () => {
      state.token += 1;
      state.playing = false;
      pauseAll(video);
      renderStage(scene);
      const version = selectedVersion(scene, select);
      if (version) {
        stageVersion.value = version.id;
        applyToVideo(stageVideo, version);
      }
      stageVideo.pause();
    });
  }

  function render() {
    const list = scenes();
    const ready = list.filter((s) => s.status === "ok").length;
    const target = list.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    const minutes = Math.floor(target / 60);
    const seconds = target % 60;
    document.getElementById("stats").textContent =
      list.length + "씬 · 준비 " + ready + " · 목표 " + minutes + "분 " + String(seconds).padStart(2, "0") + "초";

    grid.replaceChildren();
    let group = null;
    list.forEach((scene) => {
      if (scene.group !== group) {
        group = scene.group;
        const label = document.createElement("h2");
        label.className = "group-label";
        label.textContent = group || "";
        grid.append(label);
      }
      const card = document.createElement("article");
      card.className = "card" + (scene.status === "ok" ? "" : " is-missing");
      card.dataset.scene = scene.id;
      card.dataset.order = String(scene.order);
      card.id = "card-" + scene.id;

      const frame = document.createElement("div");
      frame.className = "frame" + (scene.status === "ok" ? "" : " frame-empty");
      if (scene.status === "ok") {
        const video = document.createElement("video");
        video.controls = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "");
        video.preload = "metadata";
        video.setAttribute("aria-label", scene.id);
        const version = defaultVersion(scene);
        if (version) applyToVideo(video, version);
        frame.append(video);
      } else {
        const hold = document.createElement("p");
        hold.textContent = "영상 준비 중";
        frame.append(hold);
      }
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = String(scene.order).padStart(2, "0");
      frame.append(badge);

      const body = document.createElement("div");
      body.className = "card-body";
      const kicker = document.createElement("p");
      kicker.className = "card-kicker";
      [scene.id, scene.part || "", fmtTarget(scene)].forEach((bit) => {
        if (!bit) return;
        const span = document.createElement("span");
        span.textContent = bit;
        kicker.append(span);
      });
      const title = document.createElement("h3");
      title.textContent = scene.description || scene.id;
      const label = document.createElement("label");
      label.className = "ver";
      label.append(document.createTextNode("버전"));
      const select = document.createElement("select");
      select.setAttribute("aria-label", scene.id + " 버전");
      fillSelect(select, scene);
      label.append(select);
      body.append(kicker, title, label);
      card.append(frame, body);
      grid.append(card);
      bindCard(card, scene);
    });

    const active = sceneById(state.activeId) || list[0];
    if (active) renderStage(active);
    syncStick();
  }

  function syncStick() {
    const stage = document.getElementById("stage");
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const height = mobile ? stage.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty("--stick", height + "px");
  }

  async function loadManifest() {
    try {
      const res = await fetch("manifest.json?ts=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch (err) {
      const res = await fetch("manifest.seed.json?ts=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw err;
      return await res.json();
    }
  }

  function waitEnd(video, token) {
    return new Promise((resolve) => {
      let timer = 0;
      const done = () => {
        video.removeEventListener("ended", done);
        video.removeEventListener("error", fail);
        window.clearInterval(timer);
        resolve();
      };
      const fail = () => done();
      video.addEventListener("ended", done);
      video.addEventListener("error", fail);
      timer = window.setInterval(() => {
        if (state.token !== token) done();
      }, 400);
    });
  }

  function askResume() {
    resumeBtn.hidden = false;
    return new Promise((resolve) => {
      state.resume = resolve;
    });
  }

  resumeBtn.addEventListener("click", () => {
    resumeBtn.hidden = true;
    if (state.resume) {
      const go = state.resume;
      state.resume = null;
      go();
    }
  });

  async function playAll() {
    const token = ++state.token;
    state.playing = true;
    resumeBtn.hidden = true;
    document.getElementById("play-all").disabled = true;
    for (const scene of scenes()) {
      if (state.token !== token) break;
      renderStage(scene);
      const card = document.getElementById("card-" + scene.id);
      if (card) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
      if (scene.status !== "ok" || !defaultVersion(scene)) {
        setNotice(scene.id + " 영상 준비 중. 다음 씬으로 넘어갑니다.");
        await new Promise((r) => setTimeout(r, 900));
        if (state.token !== token) break;
        continue;
      }
      setNotice(scene.id + " 재생");
      const version = defaultVersion(scene);
      stageVersion.value = version.id;
      applyToVideo(stageVideo, version);
      try { stageVideo.currentTime = 0; } catch (err) { /* metadata may still be loading */ }
      pauseAll(stageVideo);
      try {
        await stageVideo.play();
      } catch (err) {
        if (state.token !== token) break;
        setNotice("브라우저가 다음 영상을 막았습니다. 이어서 재생을 눌러 주세요.");
        await askResume();
        if (state.token !== token) break;
        try { await stageVideo.play(); } catch (e) { continue; }
      }
      await waitEnd(stageVideo, token);
    }
    if (state.token === token) {
      state.playing = false;
      setNotice("전체 재생이 끝났습니다.");
    }
    document.getElementById("play-all").disabled = false;
  }

  document.getElementById("play-all").addEventListener("click", () => {
    playAll();
  });
  document.getElementById("stop-all").addEventListener("click", () => {
    state.token += 1;
    state.playing = false;
    stageVideo.pause();
    pauseAll(null);
    resumeBtn.hidden = true;
    document.getElementById("play-all").disabled = false;
    setNotice("재생을 멈췄습니다.");
  });
  stageVersion.addEventListener("change", () => {
    const scene = sceneById(state.activeId);
    const version = selectedVersion(scene, stageVersion);
    if (version) applyToVideo(stageVideo, version);
    const card = document.getElementById("card-" + state.activeId);
    if (!card) return;
    const select = card.querySelector("select");
    const video = card.querySelector("video");
    if (select) select.value = stageVersion.value;
    if (video && version) applyToVideo(video, version);
  });
  stageVideo.addEventListener("play", () => pauseAll(stageVideo));
  window.addEventListener("resize", syncStick);

  loadManifest()
    .then((data) => {
      state.manifest = data;
      if (data.title) document.title = data.title;
      render();
    })
    .catch(() => {
      setNotice("씬 목록을 불러오지 못했습니다.");
    });

  window.setInterval(async () => {
    if (state.playing) return;
    try {
      const next = await loadManifest();
      if (!state.manifest || next.generatedAt !== state.manifest.generatedAt) {
        state.manifest = next;
        render();
      }
    } catch (err) {
      /* keep the list already on screen */
    }
  }, 20000);
})();
