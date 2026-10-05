(() => {
  const DEVICE_SIZES = [
    { w: 1080, h: 624, key: "android_normal", package: "device" },
    { w: 1242, h: 669, key: "iphone", package: "device" },
    { w: 1242, h: 810, key: "iphone_x", package: "device" },
    { w: 1440, h: 963, key: "android_aspect_ratio_2", package: "device" },
    { w: 1536, h: 686, key: "android_pad", package: "device" },
    { w: 1668, h: 761, key: "ipad", package: "device" },
    { w: 2160, h: 700, key: "android_folded", package: "device" },
  ];
  const EXTRA_SIZES = [
    { w: 1029, h: 619, key: "order_confirm", package: "order_confirm" },
    { w: 1120, h: 1560, key: "McPO", package: "mcpo" },
  ];
  const ALL_SIZES = [...DEVICE_SIZES, ...EXTRA_SIZES];
  const DEVICE_KEYS = DEVICE_SIZES.map((d) => d.key);
  const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
  const SKIP_NAMES = /^(?:\._|\.)|^\.ds_store$|^thumbs\.db$|^desktop\.ini$/i;

  const state = {
    files: [],
    selectedId: null,
  };

  const els = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("file-input"),
    folderInput: document.getElementById("folder-input"),
    browseFiles: document.getElementById("browse-files"),
    browseFolder: document.getElementById("browse-folder"),
    uploadStatus: document.getElementById("upload-status"),
    packageSummary: document.getElementById("package-summary"),
    fileList: document.getElementById("file-list"),
    previewStage: document.getElementById("preview-stage"),
    reviewForm: document.getElementById("review-form"),
    reviewNotes: document.getElementById("review-notes"),
    namingForm: document.getElementById("naming-form"),
    metaApp: document.getElementById("meta-app"),
    metaRegion: document.getElementById("meta-region"),
    metaYear: document.getElementById("meta-year"),
    metaCampaign: document.getElementById("meta-campaign"),
    metaMonth: document.getElementById("meta-month"),
    metaSuffix: document.getElementById("meta-suffix"),
    renameOrder: document.getElementById("rename-order-confirm"),
    tokenPreview: document.getElementById("naming-preview-token"),
    mappingList: document.getElementById("mapping-list"),
    downloadZip: document.getElementById("download-zip"),
    zipHint: document.getElementById("zip-hint"),
  };

  function uid() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function extOf(name) {
    const i = name.lastIndexOf(".");
    return i >= 0 ? name.slice(i) : "";
  }

  function baseOf(name) {
    return name.replace(/^.*[\\/]/, "");
  }

  function isSkippable(name) {
    const n = baseOf(name);
    if (SKIP_NAMES.test(n)) return true;
    if (name.includes("__MACOSX")) return true;
    return false;
  }

  function isImageFile(file) {
    if (file.type && file.type.startsWith("image/")) return true;
    return IMAGE_EXT.test(file.name);
  }

  function sizeKey(w, h) {
    return ALL_SIZES.find((s) => s.w === w && s.h === h) || null;
  }

  function parseName(file) {
    const name = baseOf(file.name).replace(/\.[^.]+$/, "");
    const path = file.relPath || file.webkitRelativePath || file.name;
    const appMatch = path.match(/(?:^|[\\/_-])(FP|FG)(?:[\\/_-]|$)/i);
    const regionMatch = path.match(/(?:^|[\\/_-])(FP|FG)_([A-Z]{2,3})_/i) ||
      path.match(/(?:^|[\\/_-])(US|UK|IE|AU|CA|NZ|DE|FR|ES|IT|NL|BE|AT|CH|DK|SE|NO|FI|PL)(?:[\\/_-]|$)/i);
    const versionMatch = name.match(/_(tomorrow|today|soon)$/i);
    const known = {};
    const conv = name.match(
      /^(FP|FG)_([A-Z]{2,3})_(\d{4})_(.+?)_([a-z0-9]+)_((?:android_normal|iphone_x|iphone|android_aspect_ratio_2|android_pad|ipad|android_folded|order_confirm))(?:_([a-z0-9]+))?$/i
    );
    if (conv) {
      known.app = conv[1].toUpperCase();
      known.region = conv[2].toUpperCase();
      known.year = conv[3];
      known.campaign = conv[4];
      known.month = conv[5].toLowerCase();
      known.namedDevice = conv[6].toLowerCase();
      known.suffix = conv[7] ? conv[7].toLowerCase() : "";
    } else {
      if (appMatch) known.app = appMatch[1].toUpperCase();
      if (regionMatch) known.region = (regionMatch[2] || regionMatch[1]).toUpperCase();
      if (known.region === "FP" || known.region === "FG") delete known.region;
      if (versionMatch) known.suffix = versionMatch[1].toLowerCase();
    }
    return known;
  }

  function groupKey(rec) {
    const parsed = rec.parsed;
    const meta = namingMeta();
    const app = parsed.app || meta.app || "Unknown app";
    const region = rec.regionOverride || parsed.region || meta.region || "Unknown region";
    const version = rec.suffixOverride != null && rec.suffixOverride !== ""
      ? rec.suffixOverride
      : parsed.suffix || meta.suffix || "base";
    return `${app} · ${region} · ${version}`;
  }

  function campaignToken(raw) {
    return String(raw || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function monthToken(raw) {
    return String(raw || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function suffixToken(raw) {
    let s = String(raw || "").trim().toLowerCase().replace(/^_+/, "");
    s = s.replace(/[^a-z0-9]+/g, "");
    return s;
  }

  function regionToken(raw) {
    return String(raw || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "");
  }

  async function readDimensions(file) {
    if (window.createImageBitmap) {
      try {
        const bmp = await createImageBitmap(file);
        const dim = { w: bmp.width, h: bmp.height };
        bmp.close();
        return dim;
      } catch (_) {
        /* fall through */
      }
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const dim = { w: img.naturalWidth, h: img.naturalHeight };
        URL.revokeObjectURL(url);
        resolve(dim);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("unreadable"));
      };
      img.src = url;
    });
  }

  async function walkEntry(entry, out, prefix) {
    const pathPrefix = prefix || "";
    if (entry.isFile) {
      await new Promise((resolve, reject) => {
        entry.file((file) => {
          const rel = pathPrefix + file.name;
          Object.defineProperty(file, "relPath", { value: rel, configurable: true });
          out.push(file);
          resolve();
        }, reject);
      });
      return;
    }
    if (entry.isDirectory) {
      if (entry.name === "__MACOSX") return;
      const reader = entry.createReader();
      const nextPrefix = pathPrefix + entry.name + "/";
      const readBatch = async () => {
        const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
        if (!batch.length) return;
        for (const child of batch) await walkEntry(child, out, nextPrefix);
        await readBatch();
      };
      await readBatch();
    }
  }

  async function filesFromDataTransfer(dt) {
    const collected = [];
    if (dt.items && dt.items.length) {
      const walks = [];
      for (const item of dt.items) {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) walks.push(walkEntry(entry, collected, ""));
        else if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) collected.push(f);
        }
      }
      await Promise.all(walks);
      if (collected.length) return collected;
    }
    return [...dt.files];
  }

  async function ingestFiles(fileList) {
    const incoming = [];
    for (const file of fileList) {
      const rel = file.relPath || file.webkitRelativePath || file.name;
      if (isSkippable(rel) || isSkippable(file.name)) continue;
      incoming.push(file);
    }
    const records = [];
    for (const file of incoming) {
      const rec = {
        id: uid(),
        file,
        name: baseOf(file.name),
        rel: file.relPath || file.webkitRelativePath || file.name,
        url: isImageFile(file) ? URL.createObjectURL(file) : "",
        w: null,
        h: null,
        match: null,
        readable: false,
        parsed: parseName(file),
        status: "unsupported",
        regionOverride: "",
        suffixOverride: "",
        review: {
          clipping: false,
          legibility: false,
          offer: false,
          product: false,
          shipping: false,
          cta: false,
          expiry: false,
          notes: "",
        },
      };
      if (!isImageFile(file)) {
        rec.status = "unreadable";
        records.push(rec);
        continue;
      }
      try {
        const dim = await readDimensions(file);
        rec.w = dim.w;
        rec.h = dim.h;
        rec.readable = true;
        rec.match = sizeKey(dim.w, dim.h);
        rec.status = rec.match ? "matched" : "unsupported";
        if (!rec.suffixOverride && rec.parsed.suffix) rec.suffixOverride = rec.parsed.suffix;
        if (!rec.regionOverride && rec.parsed.region) rec.regionOverride = rec.parsed.region;
      } catch (_) {
        rec.status = "unreadable";
      }
      records.push(rec);
    }
    state.files.push(...records);
    markDuplicates();
    render();
  }

  function markDuplicates() {
    const buckets = new Map();
    for (const rec of state.files) {
      if (!rec.match || !rec.readable) continue;
      const key = `${groupKey(rec)}::${rec.match.key}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(rec);
    }
    for (const rec of state.files) {
      if (rec.status === "unreadable" || rec.status === "unsupported") continue;
      rec.duplicate = false;
    }
    for (const group of buckets.values()) {
      if (group.length > 1) {
        for (const rec of group) rec.duplicate = true;
      }
    }
  }

  function packages() {
    const map = new Map();
    for (const rec of state.files) {
      const key = groupKey(rec);
      if (!map.has(key)) {
        map.set(key, {
          key,
          files: [],
          devices: new Set(),
          extras: new Set(),
          unsupported: 0,
          unreadable: 0,
          duplicates: 0,
        });
      }
      const pkg = map.get(key);
      pkg.files.push(rec);
      if (rec.duplicate) pkg.duplicates += 1;
      if (rec.status === "unreadable") pkg.unreadable += 1;
      else if (!rec.match) pkg.unsupported += 1;
      else if (rec.match.package === "device") pkg.devices.add(rec.match.key);
      else pkg.extras.add(rec.match.key);
    }
    return [...map.values()];
  }

  function namingMeta() {
    return {
      app: els.metaApp.value,
      region: regionToken(els.metaRegion.value),
      year: String(els.metaYear.value || "").trim(),
      campaign: campaignToken(els.metaCampaign.value),
      month: monthToken(els.metaMonth.value),
      suffix: suffixToken(els.metaSuffix.value),
      renameOrder: els.renameOrder.checked,
    };
  }

  function metaComplete(meta) {
    return meta.app && meta.region && /^\d{4}$/.test(meta.year) && meta.campaign && meta.month;
  }

  function plannedName(rec, meta) {
    const region = regionToken(rec.regionOverride || meta.region);
    const suffixSrc = rec.suffixOverride !== "" ? rec.suffixOverride : meta.suffix;
    const suffix = suffixToken(suffixSrc);
    const suffixPart = suffix ? `_${suffix}` : "";
    if (!rec.readable || !rec.match) {
      return { name: rec.name, action: "unchanged", reason: rec.status === "unreadable" ? "File could not be read as an image." : "Unsupported dimensions. No device mapping." };
    }
    if (rec.match.key === "McPO") {
      return { name: rec.name, action: "unchanged", reason: "McPO filenames stay unchanged." };
    }
    if (rec.match.key === "order_confirm" && !meta.renameOrder) {
      return { name: rec.name, action: "unchanged", reason: "Order confirmation stays unchanged unless the rename option is selected." };
    }
    if (!metaComplete(meta) || !region) {
      return { name: rec.name, action: "blocked", reason: "Enter app, region, year, campaign, and month before renaming." };
    }
    if (!DEVICE_KEYS.includes(rec.match.key) && rec.match.key !== "order_confirm") {
      return { name: rec.name, action: "unchanged", reason: "No rename mapping for this asset type." };
    }
    const device = rec.match.key;
    const next = `${meta.app}_${region}_${meta.year}_${meta.campaign}_${meta.month}_${device}${suffixPart}${extOf(rec.name)}`;
    if (next === rec.name) {
      return { name: next, action: "already-correct", reason: "Filename already matches the required format." };
    }
    return { name: next, action: "rename", reason: "" };
  }

  function mapping() {
    const meta = namingMeta();
    const rows = state.files.map((rec) => ({ rec, plan: plannedName(rec, meta) }));
    const counts = new Map();
    for (const row of rows) {
      if (row.plan.action === "rename" || row.plan.action === "already-correct") {
        counts.set(row.plan.name, (counts.get(row.plan.name) || 0) + 1);
      }
    }
    for (const row of rows) {
      if ((row.plan.action === "rename" || row.plan.action === "already-correct") && counts.get(row.plan.name) > 1) {
        row.plan.action = "collision";
        row.plan.reason = `Filename collision: ${row.plan.name}. Resolve duplicates before download. Names are not auto-numbered.`;
      }
    }
    return { meta, rows };
  }

  function statusLabel(rec) {
    if (rec.status === "unreadable") return ["Unreadable", "status-bad"];
    if (!rec.match) return ["Unsupported size", "status-warn"];
    if (rec.duplicate) return ["Duplicate", "status-warn"];
    if (rec.match.key === "McPO" || rec.match.key === "order_confirm") return [rec.match.key, "status-info"];
    return [rec.match.key, "status-ok"];
  }

  function renderUploadStatus() {
    if (!state.files.length) {
      els.uploadStatus.hidden = true;
      els.uploadStatus.innerHTML = "";
      return;
    }
    els.uploadStatus.hidden = false;
    els.uploadStatus.innerHTML = `<span>${state.files.length} file${state.files.length === 1 ? "" : "s"} loaded. Processing is local only.</span><button type="button" class="btn btn-secondary" id="clear-files">Clear</button>`;
    document.getElementById("clear-files").onclick = () => {
      for (const rec of state.files) if (rec.url) URL.revokeObjectURL(rec.url);
      state.files = [];
      state.selectedId = null;
      render();
    };
  }

  function renderPackages() {
    const pkgs = packages();
    if (!pkgs.length) {
      els.packageSummary.innerHTML = `<div class="pkg-card"><h3>No files yet</h3><p>Drop a delivery to check each app, region, and version against the seven device sizes plus order confirmation and McPO.</p></div>`;
      return;
    }
    els.packageSummary.innerHTML = pkgs.map((pkg) => {
      const missing = DEVICE_KEYS.filter((k) => !pkg.devices.has(k));
      const complete = missing.length === 0;
      const hasOrder = pkg.extras.has("order_confirm");
      const hasMcpo = pkg.extras.has("McPO");
      return `<article class="pkg-card">
        <h3>${escapeHtml(pkg.key)}</h3>
        <p class="${complete ? "ok" : "bad"}">Device package: ${pkg.devices.size}/7 ${complete ? "complete" : "incomplete"}</p>
        <ul>
          ${missing.length ? `<li class="bad">Missing: ${missing.join(", ")}</li>` : `<li class="ok">All seven device sizes present</li>`}
          <li class="${hasOrder ? "ok" : "bad"}">Order confirmation 1029×619: ${hasOrder ? "present" : "missing"}</li>
          <li class="${hasMcpo ? "ok" : "bad"}">McPO 1120×1560: ${hasMcpo ? "present" : "missing"}</li>
          ${pkg.duplicates ? `<li class="bad">Duplicate mapped sizes: ${pkg.duplicates}</li>` : ""}
          ${pkg.unsupported ? `<li>Unsupported dimensions: ${pkg.unsupported}</li>` : ""}
          ${pkg.unreadable ? `<li class="bad">Unreadable: ${pkg.unreadable}</li>` : ""}
        </ul>
      </article>`;
    }).join("");
  }

  function renderFileList() {
    if (!state.files.length) {
      els.fileList.innerHTML = `<p class="preview-note">Results will list thumbnails, original names, actual pixel size, matched type, and status.</p>`;
      return;
    }
    els.fileList.innerHTML = state.files.map((rec) => {
      const [label, cls] = statusLabel(rec);
      const dim = rec.readable ? `${rec.w}×${rec.h}` : "n/a";
      const type = rec.match ? rec.match.key : "none";
      const selected = rec.id === state.selectedId ? " selected" : "";
      const thumb = rec.url ? `<img src="${rec.url}" alt="">` : `<div></div>`;
      return `<article class="file-row${selected}" data-id="${rec.id}">
        ${thumb}
        <div class="file-meta">
          <div class="name">${escapeHtml(rec.name)}</div>
          <div class="sub">${escapeHtml(rec.rel)} · ${dim} · ${escapeHtml(type)}</div>
        </div>
        <span class="status ${cls}">${escapeHtml(label)}</span>
      </article>`;
    }).join("");
    els.fileList.querySelectorAll(".file-row").forEach((row) => {
      row.addEventListener("click", () => {
        state.selectedId = row.dataset.id;
        renderPreview();
        els.fileList.querySelectorAll(".file-row").forEach((r) => r.classList.toggle("selected", r.dataset.id === state.selectedId));
      });
    });
  }

  function selectedRecord() {
    return state.files.find((f) => f.id === state.selectedId) || null;
  }

  function renderPreview() {
    const rec = selectedRecord();
    if (!rec) {
      els.previewStage.classList.add("empty");
      els.previewStage.textContent = "Select a file to inspect.";
      els.reviewForm.hidden = true;
      return;
    }
    els.reviewForm.hidden = false;
    if (rec.url && rec.readable) {
      els.previewStage.classList.remove("empty");
      els.previewStage.innerHTML = `<img src="${rec.url}" alt="${escapeHtml(rec.name)}">`;
    } else {
      els.previewStage.classList.add("empty");
      els.previewStage.textContent = rec.status === "unreadable" ? "This file could not be opened as an image." : "No preview.";
    }
    for (const box of els.reviewForm.querySelectorAll('input[type="checkbox"]')) {
      box.checked = Boolean(rec.review[box.name]);
    }
    els.reviewNotes.value = rec.review.notes;
  }

  function renderMapping() {
    const { meta, rows } = mapping();
    if (metaComplete(meta)) {
      const suffix = meta.suffix ? `_${meta.suffix}` : "";
      els.tokenPreview.textContent = `Pattern: ${meta.app}_${meta.region}_${meta.year}_${meta.campaign}_${meta.month}_[device]${suffix}.[ext]`;
    } else {
      els.tokenPreview.textContent = "Fill the required naming fields to preview new filenames. App and region stay uppercase. Campaign and month become lowercase tokens.";
    }
    if (!rows.length) {
      els.mappingList.innerHTML = `<p class="preview-note">Filename mapping appears here after you add files.</p>`;
      els.downloadZip.disabled = true;
      return;
    }
    els.mappingList.innerHTML = rows.map(({ rec, plan }) => {
      const [label, cls] = plan.action === "rename" || plan.action === "already-correct"
        ? [plan.action === "already-correct" ? "Already correct" : "Will rename", "status-ok"]
        : plan.action === "collision"
          ? ["Collision", "status-bad"]
          : plan.action === "blocked"
            ? ["Needs naming", "status-warn"]
            : ["Unchanged", "status-info"];
      const thumb = rec.url ? `<img src="${rec.url}" alt="">` : `<div></div>`;
      return `<article class="map-row" data-id="${rec.id}">
        ${thumb}
        <div class="file-meta">
          <div class="name">${escapeHtml(rec.name)}</div>
          <div class="arrow">${plan.action === "rename" || plan.action === "already-correct" || plan.action === "collision" ? `→ ${escapeHtml(plan.name)}` : escapeHtml(plan.reason)}</div>
          ${plan.action === "collision" || plan.action === "blocked" ? `<div class="sub">${escapeHtml(plan.reason)}</div>` : ""}
        </div>
        <div>
          <label class="region-override">Region override
            <input data-region="${rec.id}" value="${escapeHtml(rec.regionOverride || "")}" placeholder="${escapeHtml(meta.region || "US")}">
          </label>
          <label class="suffix-override">Suffix override
            <input data-suffix="${rec.id}" value="${escapeHtml(rec.suffixOverride)}" placeholder="${escapeHtml(meta.suffix || "none")}">
          </label>
        </div>
        <div>
          <span class="status ${cls}">${label}</span>
          <button type="button" class="btn btn-small btn-secondary" data-dl="${rec.id}" ${plan.action === "collision" || plan.action === "blocked" ? "disabled" : ""}>Download</button>
        </div>
      </article>`;
    }).join("");

    els.mappingList.querySelectorAll("[data-region]").forEach((input) => {
      input.addEventListener("change", () => {
        const rec = state.files.find((f) => f.id === input.dataset.region);
        if (rec) rec.regionOverride = regionToken(input.value);
        markDuplicates();
        renderPackages();
        renderMapping();
      });
    });
    els.mappingList.querySelectorAll("[data-suffix]").forEach((input) => {
      input.addEventListener("change", () => {
        const rec = state.files.find((f) => f.id === input.dataset.suffix);
        if (rec) rec.suffixOverride = suffixToken(input.value);
        markDuplicates();
        renderPackages();
        renderMapping();
      });
    });
    els.mappingList.querySelectorAll("[data-dl]").forEach((btn) => {
      btn.addEventListener("click", () => downloadOne(btn.dataset.dl));
    });

    const collisions = rows.some((r) => r.plan.action === "collision");
    const blocked = rows.some((r) => r.plan.action === "blocked");
    els.downloadZip.disabled = !state.files.length || collisions || blocked;
    if (collisions) els.zipHint.textContent = "ZIP is blocked until filename collisions are resolved.";
    else if (blocked) els.zipHint.textContent = "ZIP is blocked until required naming fields are complete.";
    else els.zipHint.textContent = "ZIP includes renamed copies, unchanged files in _unchanged, plus a review report and filename mapping. Originals on disk are not modified.";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    renderUploadStatus();
    renderPackages();
    renderFileList();
    renderPreview();
    renderMapping();
  }

  async function downloadOne(id) {
    const { rows } = mapping();
    const row = rows.find((r) => r.rec.id === id);
    if (!row || row.plan.action === "collision" || row.plan.action === "blocked") return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(row.rec.file);
    a.download = row.plan.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function reviewReport(rows) {
    const pkgs = packages();
    const lines = [];
    lines.push("McSpace Asset Checker review report");
    lines.push("This report records dimension checks and manual reviewer notes.");
    lines.push("It is not copy approval, visual approval, or campaign sign-off.");
    lines.push("");
    for (const pkg of pkgs) {
      const missing = DEVICE_KEYS.filter((k) => !pkg.devices.has(k));
      lines.push(`Package: ${pkg.key}`);
      lines.push(`Device sizes: ${pkg.devices.size}/7`);
      if (missing.length) lines.push(`Missing: ${missing.join(", ")}`);
      lines.push(`Order confirmation: ${pkg.extras.has("order_confirm") ? "present" : "missing"}`);
      lines.push(`McPO: ${pkg.extras.has("McPO") ? "present" : "missing"}`);
      lines.push("");
    }
    lines.push("Files");
    for (const { rec, plan } of rows) {
      const dim = rec.readable ? `${rec.w}x${rec.h}` : "unreadable";
      const type = rec.match ? rec.match.key : "none";
      const checks = Object.entries(rec.review)
        .filter(([k, v]) => k !== "notes" && v)
        .map(([k]) => k);
      lines.push(`- ${rec.name} | ${dim} | ${type} | ${plan.action} -> ${plan.name}`);
      if (plan.reason) lines.push(`  ${plan.reason}`);
      if (checks.length) lines.push(`  Manual flags: ${checks.join(", ")}`);
      if (rec.review.notes) lines.push(`  Notes: ${rec.review.notes}`);
    }
    return lines.join("\n");
  }

  function mappingCsv(rows) {
    const header = "original,new_name,action,reason,width,height,asset_type";
    const body = rows.map(({ rec, plan }) => {
      const cells = [
        rec.name,
        plan.name,
        plan.action,
        plan.reason,
        rec.w ?? "",
        rec.h ?? "",
        rec.match ? rec.match.key : "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      return cells.join(",");
    });
    return [header, ...body].join("\n");
  }

  async function downloadZip() {
    if (typeof JSZip === "undefined") {
      els.zipHint.textContent = "ZIP library failed to load. Check the network and retry.";
      return;
    }
    const { rows } = mapping();
    if (rows.some((r) => r.plan.action === "collision" || r.plan.action === "blocked")) return;
    const zip = new JSZip();
    for (const { rec, plan } of rows) {
      const buf = await rec.file.arrayBuffer();
      if (plan.action === "rename" || plan.action === "already-correct") {
        zip.file(plan.name, buf);
      } else {
        const safeRel = String(rec.rel || rec.name).replace(/\\/g, "/").replace(/^\/+/, "");
        zip.file(`_unchanged/${safeRel}`, buf);
      }
    }
    zip.file("_reports/review-report.txt", reviewReport(rows));
    zip.file("_reports/filename-mapping.csv", mappingCsv(rows));
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = URL.createObjectURL(blob);
    a.download = `mcspace-renamed-${stamp}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((ev) => {
    els.dropzone.addEventListener(ev, (e) => {
      preventDefaults(e);
      els.dropzone.classList.add("is-drag");
    });
  });
  ["dragleave", "drop"].forEach((ev) => {
    els.dropzone.addEventListener(ev, (e) => {
      preventDefaults(e);
      if (ev === "dragleave") els.dropzone.classList.remove("is-drag");
    });
  });
  els.dropzone.addEventListener("drop", async (e) => {
    els.dropzone.classList.remove("is-drag");
    const files = await filesFromDataTransfer(e.dataTransfer);
    await ingestFiles(files);
  });
  els.dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      els.fileInput.click();
    }
  });
  els.browseFiles.addEventListener("click", (e) => {
    e.stopPropagation();
    els.fileInput.click();
  });
  els.browseFolder.addEventListener("click", (e) => {
    e.stopPropagation();
    els.folderInput.click();
  });
  els.dropzone.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    els.fileInput.click();
  });
  els.fileInput.addEventListener("change", async () => {
    await ingestFiles([...els.fileInput.files]);
    els.fileInput.value = "";
  });
  els.folderInput.addEventListener("change", async () => {
    await ingestFiles([...els.folderInput.files]);
    els.folderInput.value = "";
  });

  els.reviewForm.addEventListener("change", () => {
    const rec = selectedRecord();
    if (!rec) return;
    for (const box of els.reviewForm.querySelectorAll('input[type="checkbox"]')) {
      rec.review[box.name] = box.checked;
    }
  });
  els.reviewNotes.addEventListener("input", () => {
    const rec = selectedRecord();
    if (rec) rec.review.notes = els.reviewNotes.value;
  });

  ["input", "change"].forEach((ev) => {
    els.namingForm.addEventListener(ev, () => {
      markDuplicates();
      renderPackages();
      renderMapping();
    });
  });
  els.downloadZip.addEventListener("click", () => downloadZip());

  render();
})();
