(() => {
  const ALL_SIZES = [
    { w: 1080, h: 624, key: "android_normal", pack: "mcspace", role: "required", label: "android_normal" },
    { w: 1242, h: 669, key: "iphone", pack: "mcspace", role: "required", label: "iphone" },
    { w: 1242, h: 810, key: "iphone_x", pack: "mcspace", role: "required", label: "iphone_x" },
    { w: 1440, h: 963, key: "android_aspect_ratio_2", pack: "mcspace", role: "required", label: "android_aspect_ratio_2" },
    { w: 1536, h: 686, key: "android_pad", pack: "mcspace", role: "required", label: "android_pad" },
    { w: 1668, h: 761, key: "ipad", pack: "mcspace", role: "required", label: "ipad" },
    { w: 2160, h: 700, key: "android_folded", pack: "mcspace", role: "required", label: "android_folded" },
    { w: 1029, h: 619, key: "order_confirm", pack: "mcspace", role: "extra", label: "order_confirm" },
    { w: 1120, h: 1560, key: "McPO", pack: "mcspace", role: "extra", label: "McPO" },
    { w: 994, h: 1024, key: "fg_home_hero", pack: "home_hero", role: "required", label: "FG home hero" },
    { w: 750, h: 1334, key: "pcu_normal", pack: "pcu", role: "required", label: "normal" },
    { w: 1125, h: 2436, key: "pcu_iphone_x", pack: "pcu", role: "required", label: "iphone_x" },
    { w: 1440, h: 3200, key: "pcu_aspect", pack: "pcu", role: "required", label: "aspect" },
    { w: 1536, h: 2048, key: "pcu_ipad", pack: "pcu", role: "required", label: "ipad" },
    { w: 1856, h: 2200, key: "pcu_android_folded", pack: "pcu", role: "required", label: "android_folded" },
    { w: 1200, h: 394, key: "fc_promo_1200x394", pack: "fc_promo_home_hero", role: "required", label: "1200×394" },
    { w: 1200, h: 606, key: "fc_promo_1200x606", pack: "fc_promo_home_hero", role: "required", label: "1200×606" },
    { w: 2048, h: 518, key: "fc_promo_2048x518", pack: "fc_promo_home_hero", role: "required", label: "2048×518" },
    { w: 2048, h: 614, key: "fc_promo_2048x614", pack: "fc_promo_home_hero", role: "required", label: "2048×614" },
  ];
  const PACKS = {
    mcspace: {
      title: "McSpace",
      required: ALL_SIZES.filter((s) => s.pack === "mcspace" && s.role === "required").map((s) => s.key),
      extra: ALL_SIZES.filter((s) => s.pack === "mcspace" && s.role === "extra"),
    },
    home_hero: {
      title: "FG home hero",
      required: ["fg_home_hero"],
      extra: [],
    },
    pcu: {
      title: "PCU",
      required: ALL_SIZES.filter((s) => s.pack === "pcu").map((s) => s.key),
      extra: [],
    },
    fc_promo_home_hero: {
      title: "FC home hero",
      required: ALL_SIZES.filter((s) => s.pack === "fc_promo_home_hero").map((s) => s.key),
      extra: [],
    },
  };
  const DEVICE_KEYS = PACKS.mcspace.required;
  const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
  const SKIP_NAMES = /^(?:\._|\.)|^\.ds_store$|^thumbs\.db$|^desktop\.ini$/i;
  const VERSION_RE = /(?:[-_])(tomorrow|tonight|today|soon|2day)$/i;
  const SCARCITY_BURSTS = [
    { key: "soon", label: "Expires soon" },
    { key: "tomorrow", label: "Expires tomorrow" },
    { key: "2day", label: "Ends in two days" },
    { key: "tonight", label: "Expires tonight" },
  ];
  const SCARCITY_KEYS = SCARCITY_BURSTS.map((b) => b.key);

  const state = {
    files: [],
    selectedId: null,
    showFieldErrors: false,
    filters: { pack: "", size: "", version: "", app: "", sort: "name" },
    expected: { pcuFg: 10, pcuOther: 5, mcspace: 1, home_hero: 1, fc_promo_home_hero: 1 },
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
    sizeMap: document.getElementById("size-map"),
    filterPack: document.getElementById("filter-pack"),
    filterSize: document.getElementById("filter-size"),
    filterVersion: document.getElementById("filter-version"),
    filterApp: document.getElementById("filter-app"),
    filterSort: document.getElementById("filter-sort"),
    expectPcuFg: document.getElementById("expect-pcu-fg"),
    expectPcuOther: document.getElementById("expect-pcu-other"),
    expectMcspace: document.getElementById("expect-mcspace"),
    batchTracker: document.getElementById("batch-tracker"),
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
    const exact = ALL_SIZES.find((s) => s.w === w && s.h === h);
    if (exact) return exact;
    const swapped = ALL_SIZES.find((s) => s.w === h && s.h === w);
    if (swapped) return swapped;
    const near = ALL_SIZES.find((s) => Math.abs(s.w - w) <= 2 && Math.abs(s.h - h) <= 2);
    if (near) return near;
    const nearSwap = ALL_SIZES.find((s) => Math.abs(s.w - h) <= 2 && Math.abs(s.h - w) <= 2);
    if (nearSwap) return nearSwap;
    return null;
  }

  function inferPackFromName(path) {
    const n = String(path || "");
    if (/\bPCU\b/i.test(n)) return "pcu";
    if (/\bFPC\b/i.test(n) || /\bFC[_ -]?promo/i.test(n) || /\bFC[_ -]?home[_ -]?hero/i.test(n)) return "fc_promo_home_hero";
    if (/\bFPG_HP\b/i.test(n) || /(?:^|[\\/_-])HP(?:[\\/_-]|$)/i.test(n)) return "home_hero";
    if (/android_normal|android_aspect_ratio_2|android_folded|android_pad|iphone_x|order_confirm|\bmcpo\b/i.test(n)) return "mcspace";
    return null;
  }

  function filenameMcSpaceDevice(path) {
    const n = baseOf(String(path || "")).replace(/\.[^.]+$/, "").toLowerCase().replace(/-/g, "_");
    const tokens = ["android_aspect_ratio_2", "android_folded", "android_normal", "android_pad", "iphone_x", "iphone", "ipad", "order_confirm"];
    return tokens.find((token) => n.includes(token)) || "";
  }

  function parseName(file) {
    const name = baseOf(file.name).replace(/\.[^.]+$/, "");
    const path = file.relPath || file.webkitRelativePath || file.name;
    const appMatch = path.match(/(?:^|[\\/_-])(FP|FG)(?:[\\/_-]|$)/i);
    const regionMatch = path.match(/(?:^|[\\/_-])(FP|FG)_([A-Z]{2,3})_/i) ||
      path.match(/(?:^|[\\/_-])(US|UK|IE|AU|CA|NZ|DE|FR|ES|IT|NL|BE|AT|CH|DK|SE|NO|FI|PL)(?:[\\/_-]|$)/i);
    const versionMatch = name.match(VERSION_RE);
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
      if (/^FPG(?:[_-]|$)/i.test(name) || /(?:^|[\\/_])FPG(?:[\\/_-]|$)/i.test(path)) known.app = "FG";
      else if (appMatch) known.app = appMatch[1].toUpperCase();
      if (regionMatch) known.region = (regionMatch[2] || regionMatch[1]).toUpperCase();
      if (known.region === "FP" || known.region === "FG") delete known.region;
      if (versionMatch) known.suffix = versionMatch[1].toLowerCase();
    }
    return known;
  }

  function groupKey(rec, majority) {
    const parsed = rec.parsed;
    const meta = namingMeta();
    const pack = rec.match?.pack || inferPackFromName(rec.rel || rec.name) || "unknown";
    const packTitle = PACKS[pack]?.title || "Unknown batch";
    const app = parsed.app || majority?.app || meta.app || "Unknown app";
    const region = rec.regionOverride || parsed.region || majority?.region || meta.region || "Unknown region";
    const version = rec.suffixOverride != null && rec.suffixOverride !== ""
      ? rec.suffixOverride
      : parsed.suffix || "base";
    return `${packTitle} · ${app} · ${region} · ${version}`;
  }

  function recPackId(rec) {
    return rec.match?.pack || inferPackFromName(rec.rel || rec.name) || "";
  }

  function recAppId(rec) {
    if (rec.parsed.app) return rec.parsed.app;
    if (/^FPG(?:[_-]|$)/i.test(rec.name) || /(?:^|[\\/_])FPG(?:[\\/_-]|$)/i.test(rec.rel || "")) return "FG";
    if (/^FPC(?:[_-]|$)/i.test(rec.name)) return "FC";
    return els.metaApp?.value || "";
  }

  function burstLabel(key) {
    if (key === "none") return "No expiry burst";
    if (key === "reading") return "Reading burst…";
    return SCARCITY_BURSTS.find((b) => b.key === key)?.label || key;
  }

  function burstKeyFromName(rec) {
    const suffix = String(rec.suffixOverride || rec.parsed.suffix || "").toLowerCase();
    if (SCARCITY_KEYS.includes(suffix)) return suffix;
    const n = `${rec.rel || ""} ${rec.name || ""}`.toLowerCase();
    if (/tomorrow/.test(n)) return "tomorrow";
    if (/tonight/.test(n)) return "tonight";
    if (/2day|two[\s_-]*days/.test(n)) return "2day";
    if (/(?:^|[_\-\s])soon(?:$|[_\-\s.])/.test(n)) return "soon";
    return "";
  }

  function versionToken(rec) {
    if (rec.burst?.status === "found" && rec.burst.key) return rec.burst.key;
    const named = burstKeyFromName(rec);
    if (named) return named;
    if (rec.burst?.status === "reading") return "reading";
    return "none";
  }

  function usesBurstRows(pack) {
    return pack === "pcu" || pack === "mcspace";
  }

  function readExpectedFromUI() {
    const num = (el, fallback) => Math.max(1, Number(el?.value) || fallback);
    state.expected.pcuFg = num(els.expectPcuFg, 10);
    state.expected.pcuOther = num(els.expectPcuOther, 5);
    state.expected.mcspace = num(els.expectMcspace, 1);
  }

  function expectedVersionCount(pack, app) {
    readExpectedFromUI();
    if (pack === "pcu") return app === "FG" ? state.expected.pcuFg : state.expected.pcuOther;
    if (pack === "mcspace") return state.expected.mcspace;
    return 1;
  }

  function readFiltersFromUI() {
    state.filters.pack = els.filterPack?.value || "";
    state.filters.size = els.filterSize?.value || "";
    state.filters.version = els.filterVersion?.value || "";
    state.filters.app = els.filterApp?.value || "";
    state.filters.sort = els.filterSort?.value || "name";
  }

  function visibleFiles() {
    readFiltersFromUI();
    const rows = state.files.filter((rec) => {
      if (state.filters.pack && recPackId(rec) !== state.filters.pack) return false;
      if (state.filters.size && rec.match?.key !== state.filters.size) return false;
      if (state.filters.version && versionToken(rec) !== state.filters.version) return false;
      if (state.filters.app && recAppId(rec) !== state.filters.app) return false;
      return true;
    });
    const sort = state.filters.sort;
    rows.sort((a, b) => {
      const av = (key) => {
        if (key === "size") return `${a.match?.w || 0}x${a.match?.h || 0} ${a.match?.label || ""}`;
        if (key === "version") return versionToken(a);
        if (key === "status") return `${a.status} ${a.burst?.key || ""}`;
        return a.name;
      };
      const bv = (key) => {
        if (key === "size") return `${b.match?.w || 0}x${b.match?.h || 0} ${b.match?.label || ""}`;
        if (key === "version") return versionToken(b);
        if (key === "status") return `${b.status} ${b.burst?.key || ""}`;
        return b.name;
      };
      return av(sort).localeCompare(bv(sort), undefined, { numeric: true, sensitivity: "base" });
    });
    return rows;
  }

  function fillSelect(select, values, current, allLabel) {
    if (!select) return;
    const opts = [`<option value="">${escapeHtml(allLabel)}</option>`];
    for (const value of values) {
      const selected = value === current ? " selected" : "";
      opts.push(`<option value="${escapeHtml(value)}"${selected}>${escapeHtml(value)}</option>`);
    }
    select.innerHTML = opts.join("");
    if (current && values.includes(current)) select.value = current;
  }

  function refreshFilterOptions() {
    const packs = [...new Set(state.files.map(recPackId).filter((p) => PACKS[p]))];
    fillSelect(els.filterPack, packs, state.filters.pack, "All batches");
    if (els.filterPack) {
      [...els.filterPack.options].forEach((opt) => {
        if (opt.value && PACKS[opt.value]) opt.textContent = PACKS[opt.value].title;
      });
    }
    const inPack = state.files.filter((rec) => !state.filters.pack || recPackId(rec) === state.filters.pack);
    const apps = [...new Set(inPack.map(recAppId).filter(Boolean))];
    fillSelect(els.filterApp, apps, state.filters.app, "All apps");
    const scoped = inPack.filter((rec) => !state.filters.app || recAppId(rec) === state.filters.app);
    const sizes = [...new Set(scoped.map((rec) => rec.match?.key).filter(Boolean))];
    const versions = [...new Set(scoped.map(versionToken))];
    fillSelect(els.filterSize, sizes, state.filters.size, "All sizes");
    if (els.filterSize) {
      [...els.filterSize.options].forEach((opt) => {
        const spec = ALL_SIZES.find((s) => s.key === opt.value);
        if (spec) opt.textContent = `${spec.label} ${spec.w}×${spec.h}`;
      });
    }
    const burstOpts = SCARCITY_KEYS.concat(versions.filter((v) => !SCARCITY_KEYS.includes(v)));
    fillSelect(els.filterVersion, burstOpts, state.filters.version, "All bursts");
    if (els.filterVersion) {
      [...els.filterVersion.options].forEach((opt) => {
        if (opt.value) opt.textContent = burstLabel(opt.value);
      });
    }
    if (els.filterSort) els.filterSort.value = state.filters.sort || "name";
    state.filters.pack = els.filterPack?.value || "";
    state.filters.size = els.filterSize?.value || "";
    state.filters.version = els.filterVersion?.value || "";
    state.filters.app = els.filterApp?.value || "";
    state.filters.sort = els.filterSort?.value || "name";
  }

  function sizeHeading(key) {
    const spec = ALL_SIZES.find((s) => s.key === key);
    if (!spec) return escapeHtml(key);
    return `${escapeHtml(spec.label)}<br>${spec.w}×${spec.h}`;
  }

  function trackerGroupKey(rec) {
    return `${recPackId(rec) || "unknown"}::${recAppId(rec) || "Unknown app"}`;
  }

  function renderTrackerTable(packId, app, files) {
    const spec = PACKS[packId];
    const sizeKeys = spec
      ? spec.required.concat(spec.extra.map((s) => s.key))
      : [...new Set(files.map((rec) => rec.match.key))];
    const burstPack = usesBurstRows(packId);
    const versions = burstPack
      ? SCARCITY_KEYS.concat([...new Set(files.map(versionToken))].filter((key) => !SCARCITY_KEYS.includes(key) && key !== "reading"))
      : [...new Set(files.map(versionToken))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    const expected = expectedVersionCount(packId, app);
    const cells = {};
    for (const rec of files) {
      const key = `${versionToken(rec)}::${rec.match.key}`;
      if (!cells[key]) cells[key] = [];
      cells[key].push(rec);
    }
    const reading = files.some((rec) => rec.burst?.status === "reading");
    const head = `<tr><th>${burstPack ? "Scarcity burst" : "Version"}</th>${sizeKeys.map((key) => `<th>${sizeHeading(key)}</th>`).join("")}<th>Row</th></tr>`;
    const body = versions.map((ver) => {
      let rowHave = 0;
      const tds = sizeKeys.map((key) => {
        const list = cells[`${ver}::${key}`] || [];
        if (list.length) rowHave += 1;
        const pending = reading && burstPack && SCARCITY_KEYS.includes(ver) && !list.length;
        const cls = list.length ? "ok" : pending ? "" : "bad";
        const label = list.length > 1 ? `Yes (${list.length})` : list.length ? "Yes" : pending ? "Reading…" : "Missing";
        return `<td class="${cls}"><button type="button" data-track-pack="${escapeHtml(packId)}" data-track-app="${escapeHtml(app)}" data-track-ver="${escapeHtml(ver)}" data-track-size="${escapeHtml(key)}">${label}</button></td>`;
      }).join("");
      return `<tr><th>${escapeHtml(burstLabel(ver))}</th>${tds}<td>${rowHave}/${sizeKeys.length}</td></tr>`;
    }).join("");
    const burstFoot = sizeKeys.map((key) => {
      const found = new Set(
        files.filter((rec) => rec.match.key === key && SCARCITY_KEYS.includes(versionToken(rec))).map(versionToken)
      ).size;
      const cls = found >= SCARCITY_KEYS.length ? "ok" : "bad";
      const missing = Math.max(0, SCARCITY_KEYS.length - found);
      return `<td class="${cls}">${found}/${SCARCITY_KEYS.length}${missing ? ` · need ${missing}` : ""}</td>`;
    }).join("");
    const fileFoot = sizeKeys.map((key) => {
      const count = files.filter((rec) => rec.match.key === key).length;
      const cls = count >= expected ? "ok" : "bad";
      const missing = Math.max(0, expected - count);
      return `<td class="${cls}">${count}/${expected}${missing ? ` · need ${missing}` : ""}</td>`;
    }).join("");
    const foot = burstPack
      ? `<tr><th>Bursts present / ${SCARCITY_KEYS.length}</th>${burstFoot}<td></td></tr>
         <tr><th>Files / expected ${expected}</th>${fileFoot}<td></td></tr>`
      : `<tr><th>Files / expected ${expected}</th>${fileFoot}<td></td></tr>`;
    const title = `${PACKS[packId]?.title || packId} · ${app || "Unknown app"}`;
    const note = burstPack
      ? `Rows are the scarcity bursts: Expires soon, Expires tomorrow, Ends in two days, and Expires tonight. Each size should have those four bursts. File counts still use ${expected} expected files per size${packId === "pcu" ? (app === "FG" ? " for FG" : " for other apps") : ""}.`
      : `Each version should include every required size. Expected files: ${expected}.`;
    return `<section class="track-block">
      <h3>${escapeHtml(title)}</h3>
      <p class="preview-note">${escapeHtml(note)}</p>
      <table class="track-table"><thead>${head}</thead><tbody>${body}${foot}</tbody></table>
    </section>`;
  }

  function renderTracker() {
    if (!els.batchTracker) return;
    const pack = els.filterPack?.value || "";
    const appFilter = els.filterApp?.value || "";
    const packFiles = state.files.filter((rec) => {
      if (!rec.match) return false;
      if (pack && recPackId(rec) !== pack) return false;
      if (appFilter && recAppId(rec) !== appFilter) return false;
      return true;
    });
    if (!state.files.length) {
      els.batchTracker.innerHTML = `<p class="preview-note">Drop a large batch, then filter by batch, size, and scarcity burst. PCU and McSpace rows are Expires soon, Expires tomorrow, Ends in two days, and Expires tonight.</p>`;
      return;
    }
    if (!packFiles.length) {
      els.batchTracker.innerHTML = `<p class="preview-note">No matched sizes for this batch and app filter.</p>`;
      return;
    }
    const groups = {};
    for (const rec of packFiles) {
      const key = trackerGroupKey(rec);
      if (!groups[key]) groups[key] = [];
      groups[key].push(rec);
    }
    els.batchTracker.innerHTML = Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, files]) => {
        const [packId, app] = key.split("::");
        return renderTrackerTable(packId, app, files);
      })
      .join("");
    els.batchTracker.querySelectorAll("[data-track-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (els.filterPack) els.filterPack.value = btn.getAttribute("data-track-pack") || "";
        if (els.filterApp) els.filterApp.value = btn.getAttribute("data-track-app") || "";
        if (els.filterVersion) els.filterVersion.value = btn.getAttribute("data-track-ver") || "";
        if (els.filterSize) els.filterSize.value = btn.getAttribute("data-track-size") || "";
        readFiltersFromUI();
        refreshFilterOptions();
        renderFileList();
      });
    });
  }

  function majorityForPack(pack) {
    const apps = {};
    const regions = {};
    for (const rec of state.files) {
      const recPack = rec.match?.pack || inferPackFromName(rec.rel || rec.name);
      if (recPack !== pack) continue;
      if (rec.parsed.app) apps[rec.parsed.app] = (apps[rec.parsed.app] || 0) + 1;
      const region = rec.regionOverride || rec.parsed.region;
      if (region) regions[region] = (regions[region] || 0) + 1;
    }
    const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    return { app: top(apps), region: top(regions) };
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

  const BURST_PACKS = new Set(["pcu", "mcspace"]);
  let ocrWorker = null;
  let ocrScanId = 0;

  function needsBurstCheck(rec) {
    return rec.readable && rec.url && BURST_PACKS.has(rec.match?.pack);
  }

  function normalizeOcr(text) {
    return String(text || "")
      .toUpperCase()
      .replace(/0/g, "O")
      .replace(/[^A-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function classifyBurst(text) {
    const n = normalizeOcr(text);
    if (!n) return { status: "none", key: "", label: "No expiry burst", inBurst: false };
    if (/TOMORROW|TOMOROW/.test(n)) return { status: "found", key: "tomorrow", label: "Expires tomorrow", inBurst: true };
    if (/TONIGHT/.test(n)) return { status: "found", key: "tonight", label: "Expires tonight", inBurst: true };
    if (/TWO\s+DAYS|2\s+DAYS/.test(n)) return { status: "found", key: "2day", label: "Ends in two days", inBurst: true };
    if (/\bSOON\b/.test(n)) return { status: "found", key: "soon", label: "Expires soon", inBurst: true };
    return { status: "none", key: "", label: "No expiry burst", inBurst: false, raw: n.slice(0, 80) };
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("preview unread"));
      img.src = url;
    });
  }

  function burstCrop(img) {
    const canvas = document.createElement("canvas");
    const wide = img.naturalWidth / img.naturalHeight > 2.1;
    const leftRatio = wide ? 0.26 : 0.44;
    const topRatio = 0.12;
    const heightRatio = 0.62;
    const sx = 0;
    const sy = Math.floor(img.naturalHeight * topRatio);
    const sw = Math.max(1, Math.floor(img.naturalWidth * leftRatio));
    const sh = Math.max(1, Math.floor(img.naturalHeight * heightRatio));
    const scale = 2;
    canvas.width = sw * scale;
    canvas.height = sh * scale;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async function getOcrWorker() {
    if (typeof Tesseract === "undefined") throw new Error("OCR library not loaded");
    if (!ocrWorker) ocrWorker = await Tesseract.createWorker("eng");
    return ocrWorker;
  }

  async function readBurst(rec) {
    const img = await loadImage(rec.url);
    const worker = await getOcrWorker();
    const crop = burstCrop(img);
    const cropResult = await worker.recognize(crop);
    let burst = classifyBurst(cropResult.data.text);
    if (burst.status !== "found") {
      const full = await worker.recognize(img);
      const fullBurst = classifyBurst(full.data.text);
      if (fullBurst.status === "found") burst = { ...fullBurst, inBurst: false, label: `${fullBurst.label} (not in burst crop)` };
    }
    const fileSuffix = rec.parsed.suffix || rec.suffixOverride || "";
    if (burst.status === "found" && fileSuffix && fileSuffix !== burst.key) {
      burst.mismatch = true;
      burst.label = `${burst.label} · filename ${fileSuffix}`;
    }
    return burst;
  }

  async function scanBursts() {
    const scanId = ++ocrScanId;
    const targets = state.files.filter(needsBurstCheck);
    if (!targets.length) return;
    for (const rec of targets) rec.burst = { status: "reading", key: "", label: "Reading burst…" };
    renderFileList();
    renderPackages();
    let done = 0;
    for (const rec of targets) {
      if (scanId !== ocrScanId) return;
      try {
        rec.burst = await readBurst(rec);
      } catch (_) {
        rec.burst = { status: "error", key: "", label: "Burst text unread" };
      }
      done += 1;
      const progress = document.getElementById("ocr-progress");
      if (progress) progress.textContent = `Burst text ${done}/${targets.length}`;
      refreshFilterOptions();
      renderPackages();
      renderTracker();
      renderFileList();
    }
    const progress = document.getElementById("ocr-progress");
    if (progress) progress.textContent = "Burst text checked.";
  }

  function readViaImage(file) {
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

  async function readDimensions(file) {
    const candidates = [];
    if (window.createImageBitmap) {
      try {
        const bmp = await createImageBitmap(file);
        candidates.push({ w: bmp.width, h: bmp.height });
        bmp.close();
      } catch (_) {
        /* fall through */
      }
    }
    try {
      candidates.push(await readViaImage(file));
    } catch (_) {
      /* fall through */
    }
    if (!candidates.length) throw new Error("unreadable");
    const matched = candidates.find((dim) => sizeKey(dim.w, dim.h));
    return matched || candidates[0];
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
        burst: { status: "skipped", key: "", label: "" },
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
        if (!rec.match) {
          const namedDevice = rec.parsed.namedDevice || filenameMcSpaceDevice(rec.rel || rec.name);
          if (namedDevice) {
            const hinted = ALL_SIZES.find((s) => s.pack === "mcspace" && s.key === namedDevice);
            if (hinted) {
              const d1 = Math.abs(hinted.w - dim.w) + Math.abs(hinted.h - dim.h);
              const d2 = Math.abs(hinted.w - dim.h) + Math.abs(hinted.h - dim.w);
              if (Math.min(d1, d2) <= 24) rec.match = hinted;
            }
          }
        }
        rec.status = rec.match ? "matched" : "unsupported";
        if (!rec.suffixOverride && rec.parsed.suffix) rec.suffixOverride = rec.parsed.suffix;
        if (!rec.regionOverride && rec.parsed.region) rec.regionOverride = rec.parsed.region;
      } catch (_) {
        rec.status = "unreadable";
      }
      records.push(rec);
    }
    state.files.push(...records);
    if (records.length) state.showFieldErrors = true;
    markDuplicates();
    render();
    scanBursts();
  }

  function markDuplicates() {
    const buckets = new Map();
    for (const rec of state.files) {
      if (!rec.match || !rec.readable) continue;
      const pack = rec.match.pack || inferPackFromName(rec.rel || rec.name);
      const key = `${groupKey(rec, majorityForPack(pack))}::${rec.match.key}`;
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
      const pack = rec.match?.pack || inferPackFromName(rec.rel || rec.name) || "unknown";
      const key = groupKey(rec, majorityForPack(pack));
      if (!map.has(key)) {
        map.set(key, {
          key,
          files: [],
          found: {},
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
      else {
        const packId = rec.match.pack;
        if (!pkg.found[packId]) pkg.found[packId] = new Set();
        pkg.found[packId].add(rec.match.key);
      }
    }
    return [...map.values()];
  }

  function packLines(pkg) {
    const lines = [];
    const presentPacks = Object.keys(pkg.found);
    const packsToShow = presentPacks.length ? presentPacks : [];
    for (const packId of packsToShow) {
      const spec = PACKS[packId];
      if (!spec) continue;
      const have = pkg.found[packId] || new Set();
      const missing = spec.required.filter((k) => !have.has(k));
      const complete = missing.length === 0;
      lines.push(`<li class="${complete ? "ok" : "bad"}">${escapeHtml(spec.title)}: ${spec.required.filter((k) => have.has(k)).length}/${spec.required.length} ${complete ? "complete" : "incomplete"}</li>`);
      if (missing.length) {
        const labels = missing.map((k) => {
          const spec = ALL_SIZES.find((s) => s.key === k);
          return spec ? `${spec.label} (${spec.w}×${spec.h})` : k;
        });
        lines.push(`<li class="bad">Missing: ${escapeHtml(labels.join(", "))}</li>`);
      }
      for (const extra of spec.extra) {
        const ok = have.has(extra.key);
        lines.push(`<li class="${ok ? "ok" : "bad"}">${escapeHtml(extra.label)} ${extra.w}×${extra.h}: ${ok ? "present" : "missing"}</li>`);
      }
    }
    const burstFiles = pkg.files.filter((rec) => rec.burst && rec.burst.status !== "skipped");
    if (burstFiles.length) {
      const counts = {};
      for (const rec of burstFiles) {
        const label = rec.burst.status === "reading" ? "Reading burst…" : rec.burst.label || "No expiry burst";
        counts[label] = (counts[label] || 0) + 1;
      }
      const summary = Object.entries(counts).map(([label, count]) => `${label} (${count})`).join("; ");
      lines.push(`<li>Burst text: ${escapeHtml(summary)}</li>`);
    }
    return lines;
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

  function fieldErrors() {
    const yearRaw = String(els.metaYear.value || "").trim();
    return {
      app: els.metaApp.value ? "" : "Select FP or FG.",
      region: regionToken(els.metaRegion.value) ? "" : "Enter a region, such as US.",
      year: /^\d{4}$/.test(yearRaw) ? "" : (yearRaw ? "Enter a 4-digit year." : "Enter a year."),
      campaign: campaignToken(els.metaCampaign.value) ? "" : "Enter a campaign name.",
      month: monthToken(els.metaMonth.value) ? "" : "Enter a month token, such as oct.",
    };
  }

  function applyFieldErrors() {
    const errors = fieldErrors();
    const fields = [
      [els.metaApp, "err-app", errors.app],
      [els.metaRegion, "err-region", errors.region],
      [els.metaYear, "err-year", errors.year],
      [els.metaCampaign, "err-campaign", errors.campaign],
      [els.metaMonth, "err-month", errors.month],
    ];
    const show = state.showFieldErrors;
    let firstInvalid = null;
    for (const [input, errId, message] of fields) {
      const errEl = document.getElementById(errId);
      const invalid = show && Boolean(message);
      input.classList.toggle("is-invalid", invalid);
      input.setAttribute("aria-invalid", invalid ? "true" : "false");
      input.closest("label")?.classList.toggle("field-invalid", invalid);
      if (errEl) {
        errEl.hidden = !invalid;
        errEl.textContent = invalid ? message : "";
      }
      if (invalid && !firstInvalid) firstInvalid = input;
    }
    return { errors, firstInvalid, complete: Object.values(errors).every((msg) => !msg) };
  }

  function plannedName(rec, meta) {
    const region = regionToken(rec.regionOverride || meta.region);
    const suffixSrc = rec.suffixOverride !== "" ? rec.suffixOverride : meta.suffix;
    const suffix = suffixToken(suffixSrc);
    const suffixPart = suffix ? `_${suffix}` : "";
    if (!rec.readable || !rec.match) {
      return { name: rec.name, action: "unchanged", reason: rec.status === "unreadable" ? "File could not be read as an image." : "Unsupported dimensions. No device mapping." };
    }
    if (rec.match.pack !== "mcspace") {
      return { name: rec.name, action: "unchanged", reason: `${rec.match.label} is size-check only. Filename stays unchanged.` };
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
    const named = `${rec.match.label} ${rec.w}×${rec.h}`;
    if (rec.duplicate) return [`Duplicate · ${named}`, "status-warn"];
    if (rec.match.pack !== "mcspace" || rec.match.role === "extra") return [named, "status-info"];
    return [named, "status-ok"];
  }

  function renderSizeMap() {
    if (!els.sizeMap) return;
    const packOrder = Object.keys(PACKS);
    els.sizeMap.innerHTML = `<div class="size-map-grid">${packOrder.map((packId) => {
      const spec = PACKS[packId];
      const rows = ALL_SIZES.filter((s) => s.pack === packId).map((s) =>
        `<tr><td><code>${escapeHtml(s.label)}</code></td><td>${s.w}×${s.h}</td></tr>`
      ).join("");
      return `<div class="size-map-card">
        <h4>${escapeHtml(spec.title)}</h4>
        <table>
          <thead><tr><th>Label</th><th>Size</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    }).join("")}</div>`;
  }

  function renderUploadStatus() {
    if (!state.files.length) {
      els.uploadStatus.hidden = true;
      els.uploadStatus.innerHTML = "";
      return;
    }
    els.uploadStatus.hidden = false;
    els.uploadStatus.innerHTML = `<span>${state.files.length} file${state.files.length === 1 ? "" : "s"} loaded. Processing is local only. <span id="ocr-progress"></span></span><button type="button" class="btn btn-secondary" id="clear-files">Clear</button>`;
    document.getElementById("clear-files").onclick = () => {
      for (const rec of state.files) if (rec.url) URL.revokeObjectURL(rec.url);
      state.files = [];
      state.selectedId = null;
      state.showFieldErrors = false;
      render();
    };
  }

  function detectedBatches() {
    const counts = {};
    for (const rec of state.files) {
      const pack = rec.match?.pack || inferPackFromName(rec.rel || rec.name) || "unknown";
      const title = PACKS[pack]?.title || "Unknown";
      counts[title] = (counts[title] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  function renderPackages() {
    const pkgs = packages();
    if (!pkgs.length) {
      els.packageSummary.innerHTML = `<div class="pkg-card"><h3>No files yet</h3><p>Drop a delivery to check McSpace, FG home hero, PCU, and FC home hero sizes. The tool detects the batch from the files. A PCU or FC drop is not scored against McSpace sizes.</p></div>`;
      return;
    }
    const detected = detectedBatches()
      .map(([title, count]) => `${title} (${count} file${count === 1 ? "" : "s"})`)
      .join(" · ");
    const cards = pkgs.map((pkg) => {
      const lines = packLines(pkg);
      return `<article class="pkg-card">
        <h3>${escapeHtml(pkg.key)}</h3>
        <ul>
          ${lines.join("")}
          ${pkg.duplicates ? `<li class="bad">Duplicate mapped sizes: ${pkg.duplicates}</li>` : ""}
          ${pkg.unsupported ? `<li>Unsupported dimensions: ${pkg.unsupported}</li>` : ""}
          ${pkg.unreadable ? `<li class="bad">Unreadable: ${pkg.unreadable}</li>` : ""}
        </ul>
      </article>`;
    }).join("");
    els.packageSummary.innerHTML = `<div class="pkg-card detect-card"><h3>Detected batch</h3><p>${escapeHtml(detected)}</p></div>${cards}`;
  }

  function renderFileList() {
    if (!state.files.length) {
      els.fileList.innerHTML = `<p class="preview-note">Results will list thumbnails, original names, actual pixel size, matched type, and status.</p>`;
      return;
    }
    const rows = visibleFiles();
    if (!rows.length) {
      els.fileList.innerHTML = `<p class="preview-note">No files match the current batch, size, version, or app filters.</p>`;
      return;
    }
    els.fileList.innerHTML = rows.map((rec) => {
      const [label, cls] = statusLabel(rec);
      const dim = rec.readable ? `${rec.w}×${rec.h}` : "n/a";
      const type = rec.match ? rec.match.key : "none";
      const selected = rec.id === state.selectedId ? " selected" : "";
      const thumb = rec.url ? `<img src="${rec.url}" alt="">` : `<div></div>`;
      return `<article class="file-row${selected}" data-id="${rec.id}">
        ${thumb}
        <div class="file-meta">
          <div class="name">${escapeHtml(rec.name)}</div>
          <div class="sub">${escapeHtml(rec.rel)} · ${dim} · ${escapeHtml(type)}${rec.burst && rec.burst.status !== "skipped" ? ` · ${escapeHtml(rec.burst.label || "Burst pending")}` : ""}</div>
        </div>
        <div class="status-stack">
          <span class="status ${cls}">${escapeHtml(label)}</span>
          ${rec.burst && rec.burst.status !== "skipped" ? `<span class="status ${rec.burst.mismatch ? "status-bad" : rec.burst.status === "found" ? "status-ok" : rec.burst.status === "reading" ? "status-info" : "status-warn"}">${escapeHtml(rec.burst.label || "Burst")}</span>` : ""}
        </div>
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
    const fieldState = applyFieldErrors();
    if (metaComplete(meta)) {
      const suffix = meta.suffix ? `_${meta.suffix}` : "";
      els.tokenPreview.textContent = `Pattern: ${meta.app}_${meta.region}_${meta.year}_${meta.campaign}_${meta.month}_[device]${suffix}.[ext]`;
    } else {
      els.tokenPreview.textContent = "Fill the required naming fields to preview new filenames. App and region stay uppercase. Campaign and month become lowercase tokens.";
    }
    if (!rows.length) {
      els.mappingList.innerHTML = `<p class="preview-note">Filename mapping appears here after you add files.</p>`;
      els.downloadZip.disabled = true;
      els.zipHint.classList.remove("is-error");
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
    els.zipHint.classList.toggle("is-error", collisions || blocked);
    if (collisions) els.zipHint.textContent = "ZIP is blocked until filename collisions are resolved.";
    else if (blocked) {
      const missing = Object.values(fieldState.errors).filter(Boolean);
      els.zipHint.textContent = missing.length
        ? `Complete the required fields: ${missing.join(" ")}`
        : "ZIP is blocked until required naming fields are complete.";
    } else {
      els.zipHint.classList.remove("is-error");
      els.zipHint.textContent = "ZIP includes renamed copies, unchanged files in _unchanged, plus a review report and filename mapping. Originals on disk are not modified.";
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    refreshFilterOptions();
    renderSizeMap();
    renderUploadStatus();
    renderPackages();
    renderTracker();
    renderFileList();
    renderPreview();
    renderMapping();
  }

  async function downloadOne(id) {
    const { rows } = mapping();
    const row = rows.find((r) => r.rec.id === id);
    if (!row) return;
    if (row.plan.action === "collision" || row.plan.action === "blocked") {
      state.showFieldErrors = true;
      const { firstInvalid } = applyFieldErrors();
      firstInvalid?.focus();
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(row.rec.file);
    a.download = row.plan.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function reviewReport(rows) {
    const pkgs = packages();
    const lines = [];
    lines.push("Mobile Asset Checker review report");
    lines.push("This report records dimension checks and manual reviewer notes.");
    lines.push("It is not copy approval, visual approval, or campaign sign-off.");
    lines.push("");
    for (const pkg of pkgs) {
      lines.push(`Group: ${pkg.key}`);
      const presentPacks = Object.keys(pkg.found);
      for (const packId of presentPacks) {
        const spec = PACKS[packId];
        if (!spec) continue;
        const have = pkg.found[packId] || new Set();
        const missing = spec.required.filter((k) => !have.has(k));
        lines.push(`${spec.title}: ${spec.required.filter((k) => have.has(k)).length}/${spec.required.length}`);
        if (missing.length) lines.push(`Missing: ${missing.join(", ")}`);
        for (const extra of spec.extra) {
          lines.push(`${extra.label}: ${have.has(extra.key) ? "present" : "missing"}`);
        }
      }
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
      if (rec.burst && rec.burst.status !== "skipped") lines.push(`  Burst: ${rec.burst.label || rec.burst.status}`);
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
      els.zipHint.classList.add("is-error");
      return;
    }
    state.showFieldErrors = true;
    const { complete, firstInvalid } = applyFieldErrors();
    const { rows } = mapping();
    if (!complete || rows.some((r) => r.plan.action === "collision" || r.plan.action === "blocked")) {
      firstInvalid?.focus();
      renderMapping();
      return;
    }
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
    a.download = `mobile-assets-renamed-${stamp}.zip`;
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
  ["meta-app", "meta-region", "meta-year", "meta-campaign", "meta-month"].forEach((id) => {
    document.getElementById(id).addEventListener("blur", () => {
      state.showFieldErrors = true;
      applyFieldErrors();
    });
  });
  els.downloadZip.addEventListener("click", () => downloadZip());

  function onFilterChange() {
    readFiltersFromUI();
    refreshFilterOptions();
    renderTracker();
    renderFileList();
  }
  [els.filterPack, els.filterSize, els.filterVersion, els.filterApp, els.filterSort].forEach((el) => {
    el?.addEventListener("change", onFilterChange);
  });
  [els.expectPcuFg, els.expectPcuOther, els.expectMcspace].forEach((el) => {
    el?.addEventListener("input", () => renderTracker());
  });

  render();
})();
