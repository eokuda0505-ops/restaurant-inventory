const STORAGE_KEY = "restaurant-inventory-items-v3";
const HISTORY_KEY = "restaurant-inventory-history-v3";
const SUPPLIER_KEY = "restaurant-inventory-suppliers-v1";
const COSTINGS_KEY = "restaurant-inventory-costings-v1";
const CHECK_URL_MANAGER_EMAIL = "okuda@anothertable.co.jp";

const categoryOptions = ["野菜", "果物", "肉類", "魚類", "冷凍物", "乾物", "資材", "乳製品、チーズ", "酒類", "仕込み品"];
const costingCategoryOptions = ["FOOD", "DESERT", "DRINK", "PREP"];
const storageLocationOptions = [
  "冷蔵庫１",
  "冷蔵庫２",
  "冷蔵庫３",
  "冷蔵庫４",
  "冷凍庫１",
  "冷凍庫２",
  "冷凍庫３",
  "冷凍庫４",
  "冷凍庫５",
  "冷凍庫６",
  "ワイン冷蔵",
  "ドリンク冷蔵"
];

let items = [];
let history = [];
let costings = [];
let editingId = null;
let editingCostingId = null;
let supabaseClient = null;
let currentUser = null;
let syncTimer = null;

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0
});

const unitPriceYen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const gramPriceYen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 4
});

const quantityFormat = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 2
});

const els = {
  appTitle: document.querySelector("#appTitle"),
  summaryGrid: document.querySelector("#summaryGrid"),
  totalItems: document.querySelector("#totalItems"),
  totalStock: document.querySelector("#totalStock"),
  lowStock: document.querySelector("#lowStock"),
  inventoryValue: document.querySelector("#inventoryValue"),
  table: document.querySelector("#inventoryTable"),
  emptyState: document.querySelector("#emptyState"),
  resultCount: document.querySelector("#resultCount"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  supplierFilter: document.querySelector("#supplierFilter"),
  supplierOptions: document.querySelector("#supplierOptions"),
  locationOptions: document.querySelector("#locationOptions"),
  statusFilter: document.querySelector("#statusFilter"),
  sortSelect: document.querySelector("#sortSelect"),
  clearFilters: document.querySelector("#clearFilters"),
  addSupplier: document.querySelector("#addSupplier"),
  deleteSupplier: document.querySelector("#deleteSupplier"),
  openForm: document.querySelector("#openForm"),
  dialog: document.querySelector("#itemDialog"),
  form: document.querySelector("#itemForm"),
  formTitle: document.querySelector("#formTitle"),
  cancelForm: document.querySelector("#cancelForm"),
  refreshData: document.querySelector("#refreshData"),
  exportCsv: document.querySelector("#exportCsv"),
  importCsv: document.querySelector("#importCsv"),
  movementDialog: document.querySelector("#movementDialog"),
  movementForm: document.querySelector("#movementForm"),
  movementTitle: document.querySelector("#movementTitle"),
  movementTarget: document.querySelector("#movementTarget"),
  movementItemId: document.querySelector("#movementItemId"),
  movementType: document.querySelector("#movementType"),
  movementQuantity: document.querySelector("#movementQuantity"),
  movementMemo: document.querySelector("#movementMemo"),
  cancelMovement: document.querySelector("#cancelMovement"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  loginButton: document.querySelector("#loginButton"),
  logoutButton: document.querySelector("#logoutButton"),
  authStatus: document.querySelector("#authStatus"),
  tabButtons: document.querySelectorAll(".tab-button"),
  viewPanels: document.querySelectorAll(".app-view"),
  checkLocationFilter: document.querySelector("#checkLocationFilter"),
  checkSearchInput: document.querySelector("#checkSearchInput"),
  clearCheckFilters: document.querySelector("#clearCheckFilters"),
  copyCheckUrl: document.querySelector("#copyCheckUrl"),
  checkUrlPreview: document.querySelector("#checkUrlPreview"),
  checkLocationLinks: document.querySelector("#checkLocationLinks"),
  checkLocationTitle: document.querySelector("#checkLocationTitle"),
  checkResultCount: document.querySelector("#checkResultCount"),
  checkGrid: document.querySelector("#checkGrid"),
  checkEmptyState: document.querySelector("#checkEmptyState"),
  costingSearchInput: document.querySelector("#costingSearchInput"),
  costingCategoryFilter: document.querySelector("#costingCategoryFilter"),
  costingStatusFilter: document.querySelector("#costingStatusFilter"),
  costingSortSelect: document.querySelector("#costingSortSelect"),
  clearCostingFilters: document.querySelector("#clearCostingFilters"),
  costingGrid: document.querySelector("#costingGrid"),
  costingResultCount: document.querySelector("#costingResultCount"),
  costingEmptyState: document.querySelector("#costingEmptyState"),
  openCostingForm: document.querySelector("#openCostingForm"),
  exportCostingCsv: document.querySelector("#exportCostingCsv"),
  costingDialog: document.querySelector("#costingDialog"),
  costingForm: document.querySelector("#costingForm"),
  costingFormTitle: document.querySelector("#costingFormTitle"),
  costingName: document.querySelector("#costingName"),
  costingCategory: document.querySelector("#costingCategory"),
  costingSalePrice: document.querySelector("#costingSalePrice"),
  costingYield: document.querySelector("#costingYield"),
  costingNote: document.querySelector("#costingNote"),
  ingredientRows: document.querySelector("#ingredientRows"),
  addIngredientRow: document.querySelector("#addIngredientRow"),
  costingPreviewCost: document.querySelector("#costingPreviewCost"),
  costingPreviewRate: document.querySelector("#costingPreviewRate"),
  cancelCostingForm: document.querySelector("#cancelCostingForm")
};

function hasSupabaseConfig() {
  const config = window.INVENTORY_SUPABASE;
  return Boolean(
    config?.url &&
    config?.anonKey &&
    !config.url.includes("YOUR_PROJECT_ID") &&
    !config.anonKey.includes("YOUR_SUPABASE_ANON_KEY")
  );
}

async function initSupabase() {
  if (!hasSupabaseConfig() || !window.supabase) {
    setAuthStatus("Supabase未設定");
    return;
  }

  supabaseClient = window.supabase.createClient(
    window.INVENTORY_SUPABASE.url,
    window.INVENTORY_SUPABASE.anonKey
  );

  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user ?? null;
  updateAuthView();

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    updateAuthView();
    init();
  });
}

function updateAuthView() {
  if (!supabaseClient) return;
  const loggedIn = Boolean(currentUser);
  els.loginEmail.hidden = loggedIn;
  els.loginPassword.hidden = loggedIn;
  els.loginButton.hidden = loggedIn;
  els.logoutButton.hidden = !loggedIn;
  setAuthStatus(loggedIn ? currentUser.email : "未ログイン");
  updateCheckUrlPermission();
  updateSyncTimer();
}

function setAuthStatus(text) {
  els.authStatus.textContent = text;
}

function updateSyncTimer() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }

  if (supabaseClient && currentUser) {
    syncTimer = setInterval(refreshFromCloud, 15000);
  }
}

async function refreshFromCloud() {
  if (!supabaseClient || !currentUser) return;
  if (els.dialog.open || els.movementDialog.open || els.costingDialog.open) return;
  items = await loadItems();
  history = await loadHistory();
  costings = await loadCostings();
  render();
}

async function loadItems() {
  if (supabaseClient && !currentUser) return [];

  if (supabaseClient && currentUser) {
    const { data, error } = await supabaseClient
      .from("inventory_items")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      alert(`在庫データの読み込みに失敗しました: ${error.message}`);
      return [];
    }

    return data.map(fromDbItem).map(normalizeItem);
  }

  try {
    const response = await fetch("seed-items.json", { cache: "no-store" });
    if (!response.ok) throw new Error("items api failed");
    const seedItems = await response.json();
    return seedItems.map(normalizeItem);
  } catch {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    try {
      return JSON.parse(saved).map(normalizeItem);
    } catch {
      return [];
    }
  }
}

async function loadHistory() {
  if (supabaseClient && !currentUser) return [];

  if (supabaseClient && currentUser) {
    const { data, error } = await supabaseClient
      .from("inventory_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return [];
    return data.map(fromDbMovement);
  }

  try {
    return [];
  } catch {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (!saved) return [];

    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
}

function normalizeItem(item) {
  return {
    id: item.id ?? crypto.randomUUID(),
    name: item.name ?? "",
    sku: item.sku ?? "",
    category: categoryOptions.includes(item.category) ? item.category : "野菜",
    supplier: item.supplier ?? "",
    location: normalizeLocation(item.location),
    unit: normalizeUnit(item.unit),
    stock: Number(item.stock) || 0,
    idealWeekdayStock: Number(item.idealWeekdayStock) || 0,
    idealWeekendStock: Number(item.idealWeekendStock) || 0,
    reorderPoint: Number(item.reorderPoint) || 0,
    unitPrice: roundToTwoDecimals(item.unitPrice),
    gramPrice: roundToFourDecimals(item.gramPrice) || inferGramPriceFromNote(item.note),
    note: cleanNote(item.note)
  };
}

function parseDecimalValue(value) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace("．", ".")
    .replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function roundToTwoDecimals(value) {
  return Math.round(parseDecimalValue(value) * 100) / 100;
}

function roundToFourDecimals(value) {
  return Math.round(parseDecimalValue(value) * 10000) / 10000;
}

function inferGramPriceFromNote(note) {
  const match = String(note ?? "").match(/g単価[:：]\s*([0-9０-９]+(?:[.．][0-9０-９]+)?)/u);
  return match ? roundToFourDecimals(match[1]) : 0;
}

async function loadCostings() {
  const localCostings = readLocalCostings();

  if (supabaseClient && !currentUser) return [];

  if (supabaseClient && currentUser) {
    const { data, error } = await supabaseClient
      .from("menu_costings")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      alert(`原価計算データの読み込みに失敗しました: ${error.message}`);
      return [];
    }

    if (data.length === 0 && localCostings.length > 0) {
      costings = localCostings;
      await saveCostings();
      return localCostings;
    }

    const cloudCostings = normalizeCostingsList(data.map(fromDbCosting));
    localStorage.setItem(COSTINGS_KEY, JSON.stringify(cloudCostings));
    return cloudCostings;
  }

  return localCostings;
}

function readLocalCostings() {
  try {
    return normalizeCostingsList(JSON.parse(localStorage.getItem(COSTINGS_KEY) || "[]"));
  } catch {
    return [];
  }
}

function normalizeCostingsList(entries) {
  return entries.map((costing, index) => {
    const normalized = normalizeCosting(costing);
    return {
      ...normalized,
      sortOrder: normalized.sortOrder === null ? index : normalized.sortOrder
    };
  });
}

function normalizeCosting(costing) {
  const inferredCategory = normalizeCostingCategory(costing.category ?? inferCostingCategory(costing));
  const sortOrder = Number(costing.sortOrder);
  return {
    id: costing.id ?? crypto.randomUUID(),
    name: costing.name ?? "",
    category: costingCategoryOptions.includes(inferredCategory) ? inferredCategory : "FOOD",
    salePrice: Number(costing.salePrice) || 0,
    yieldCount: Math.max(1, Number(costing.yieldCount) || 1),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : null,
    note: costing.note ?? "",
    ingredients: Array.isArray(costing.ingredients)
      ? costing.ingredients.map(normalizeIngredient).filter((ingredient) => (ingredient.itemId || ingredient.name) && (ingredient.quantity > 0 || ingredient.cost > 0))
      : []
  };
}

function normalizeCostingCategory(category) {
  return category === "DRINKU" ? "DRINK" : category;
}

function inferCostingCategory(costing) {
  const id = String(costing.id ?? "");
  const note = String(costing.note ?? "");
  if (id.startsWith("excel-alcohol") || note.includes("アルコール")) return "DRINK";
  return "FOOD";
}

function normalizeIngredient(ingredient) {
  return {
    itemId: ingredient.itemId ?? "",
    name: ingredient.name ?? "",
    quantity: Number(ingredient.quantity) || 0,
    unit: ingredient.unit ?? "",
    unitPrice: Number(ingredient.unitPrice) || 0,
    cost: Number(ingredient.cost) || 0,
    memo: ingredient.memo ?? ""
  };
}

function cleanNote(note) {
  return String(note ?? "")
    .replace(/\s*\/?\s*シート[:：].*$/u, "")
    .trim();
}

function normalizeLocation(location) {
  const cleaned = String(location ?? "").trim();
  const locationMap = {
    "冷凍１": "冷凍庫１",
    "冷凍1": "冷凍庫１",
    "冷凍２": "冷凍庫２",
    "冷凍2": "冷凍庫２",
    "冷凍庫1": "冷凍庫１",
    "冷凍庫2": "冷凍庫２",
    "冷蔵1": "冷蔵庫１",
    "冷蔵１": "冷蔵庫１",
    "冷蔵2": "冷蔵庫２",
    "冷蔵２": "冷蔵庫２",
    "冷蔵庫1": "冷蔵庫１",
    "冷蔵庫2": "冷蔵庫２"
  };

  return locationMap[cleaned] ?? cleaned;
}

function normalizeUnit(unit) {
  const cleaned = String(unit ?? "個").trim();
  const unitMap = {
    pc: "pac",
    PC: "pac",
    Pc: "pac",
    p: "pac",
    P: "pac",
    "ｐｃ": "pac",
    "ＰＣ": "pac",
    "ｐ": "pac",
    "Ｐ": "pac",
    pack: "pac",
    Pack: "pac",
    PACK: "pac",
    "ｇ": "g",
    "Ｇ": "g",
    "m l": "ml",
    "ｍｌ": "ml",
    ML: "ml",
    cs: "ケース",
    CS: "ケース",
    can: "缶",
    CAN: "缶",
    "カン": "缶",
    case: "ケース",
    CASE: "ケース"
  };

  return unitMap[cleaned] ?? cleaned;
}

async function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

  if (supabaseClient && currentUser) {
    const { error } = await supabaseClient
      .from("inventory_items")
      .upsert(items.map(toDbItem), { onConflict: "id" });

    if (error?.code === "PGRST204" || error?.code === "42703") {
      const { error: retryError } = await supabaseClient
        .from("inventory_items")
        .upsert(items.map((item) => toDbItem(item, false)), { onConflict: "id" });

      if (retryError) alert(`在庫データの保存に失敗しました: ${retryError.message}`);
      return;
    }

    if (error) alert(`在庫データの保存に失敗しました: ${error.message}`);
  }
}

async function saveHistory() {
  const recentHistory = history.slice(0, 100);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(recentHistory));

  if (supabaseClient && currentUser && recentHistory[0]) {
    const { error } = await supabaseClient
      .from("inventory_movements")
      .insert(toDbMovement(recentHistory[0]));

    if (error) console.warn(`履歴保存に失敗しました: ${error.message}`);
  }
}

async function saveCostings() {
  localStorage.setItem(COSTINGS_KEY, JSON.stringify(costings));

  if (supabaseClient && currentUser) {
    if (costings.length === 0) return;
    const { error } = await supabaseClient
      .from("menu_costings")
      .upsert(costings.map(toDbCosting), { onConflict: "id" });

    if (error?.code === "PGRST204" || error?.code === "42703") {
      const { error: retryError } = await supabaseClient
        .from("menu_costings")
        .upsert(costings.map((costing) => toDbCosting(costing, false)), { onConflict: "id" });

      if (retryError) alert(`原価計算データの保存に失敗しました: ${retryError.message}`);
      return;
    }

    if (error) alert(`原価計算データの保存に失敗しました: ${error.message}`);
  }
}

function fromDbItem(row) {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    supplier: row.supplier,
    location: row.location,
    unit: row.unit,
    stock: row.stock,
    idealWeekdayStock: row.ideal_weekday_stock,
    idealWeekendStock: row.ideal_weekend_stock,
    reorderPoint: row.reorder_point,
    unitPrice: row.unit_price,
    gramPrice: row.gram_price,
    note: row.note
  };
}

function toDbItem(item, includeGramPrice = true) {
  const normalized = normalizeItem(item);
  const row = {
    id: normalized.id,
    name: normalized.name,
    sku: normalized.sku,
    category: normalized.category,
    supplier: normalized.supplier,
    location: normalized.location,
    unit: normalized.unit,
    stock: normalized.stock,
    ideal_weekday_stock: normalized.idealWeekdayStock,
    ideal_weekend_stock: normalized.idealWeekendStock,
    reorder_point: normalized.reorderPoint,
    unit_price: normalized.unitPrice,
    note: normalized.note
  };
  if (includeGramPrice) row.gram_price = normalized.gramPrice;
  return row;
}

function fromDbMovement(row) {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    type: row.movement_type,
    quantity: Number(row.quantity),
    unit: row.unit,
    memo: row.memo,
    createdAt: row.created_at
  };
}

function toDbMovement(entry) {
  return {
    item_id: entry.itemId,
    item_name: entry.itemName,
    movement_type: entry.type,
    quantity: entry.quantity,
    unit: entry.unit,
    memo: entry.memo,
    user_email: currentUser?.email ?? ""
  };
}

function fromDbCosting(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    salePrice: row.sale_price,
    yieldCount: row.yield_count,
    sortOrder: row.sort_order,
    note: row.note,
    ingredients: row.ingredients
  };
}

function toDbCosting(costing, includeSortOrder = true) {
  const normalized = normalizeCosting(costing);
  const row = {
    id: normalized.id,
    name: normalized.name,
    category: normalized.category,
    sale_price: normalized.salePrice,
    yield_count: normalized.yieldCount,
    note: normalized.note,
    ingredients: normalized.ingredients
  };

  if (includeSortOrder) row.sort_order = normalized.sortOrder;
  return row;
}

function render() {
  renderSummary();
  renderCategoryFilter();
  renderSupplierFilter();
  renderLocationOptions();
  renderTable(getVisibleItems());
  renderCheckLocations();
  renderCheckItems();
  renderCostings();
}

function renderSummary() {
  const totalStock = items.reduce((sum, item) => sum + Number(item.stock), 0);
  const value = items.reduce((sum, item) => sum + Number(item.stock) * Number(item.unitPrice), 0);
  const low = items.filter((item) => {
    const reorderPoint = Number(item.reorderPoint);
    return reorderPoint > 0 && Number(item.stock) <= reorderPoint;
  }).length;

  els.totalItems.textContent = items.length;
  els.totalStock.textContent = quantityFormat.format(totalStock);
  els.lowStock.textContent = low;
  els.inventoryValue.textContent = yen.format(value);
}

function renderCategoryFilter() {
  const current = els.categoryFilter.value;
  els.categoryFilter.innerHTML = '<option value="">すべて</option>';

  categoryOptions.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryFilter.append(option);
  });

  els.categoryFilter.value = categoryOptions.includes(current) ? current : "";
}

function renderSupplierFilter() {
  const current = els.supplierFilter.value;
  const suppliers = getSupplierOptions();
  els.supplierFilter.innerHTML = '<option value="">すべて</option>';
  els.supplierOptions.innerHTML = "";

  suppliers.forEach((supplier) => {
    const option = document.createElement("option");
    option.value = supplier;
    option.textContent = supplier;
    els.supplierFilter.append(option);

    const datalistOption = document.createElement("option");
    datalistOption.value = supplier;
    els.supplierOptions.append(datalistOption);
  });

  els.supplierFilter.value = suppliers.includes(current) ? current : "";
}

function getSupplierOptions() {
  const saved = loadSavedSuppliers();
  return [...new Set([...items.map((item) => item.supplier).filter(Boolean), ...saved])]
    .sort((a, b) => a.localeCompare(b, "ja"));
}

function renderLocationOptions() {
  els.locationOptions.innerHTML = "";
  getStorageLocations().forEach((location) => {
    const option = document.createElement("option");
    option.value = location;
    els.locationOptions.append(option);
  });
}

function loadSavedSuppliers() {
  try {
    return JSON.parse(localStorage.getItem(SUPPLIER_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSupplierOptions(suppliers) {
  localStorage.setItem(SUPPLIER_KEY, JSON.stringify([...new Set(suppliers.filter(Boolean))]));
}

function addSupplier() {
  const supplier = window.prompt("追加する業者名を入力してください。")?.trim();
  if (!supplier) return;

  saveSupplierOptions([...loadSavedSuppliers(), supplier]);
  render();
  els.supplierFilter.value = supplier;
  renderTable(getVisibleItems());
}

function deleteSupplier() {
  const current = els.supplierFilter.value;
  const supplier = (current || window.prompt("削除する業者名を入力してください。"))?.trim();
  if (!supplier) return;

  const affectedCount = items.filter((item) => item.supplier === supplier).length;
  const message = affectedCount > 0
    ? `${supplier} が設定されている商品 ${affectedCount}件の業者名を未設定にします。よろしいですか？`
    : `${supplier} を業者候補から削除します。よろしいですか？`;
  if (!window.confirm(message)) return;

  items = items.map((item) => (item.supplier === supplier ? { ...item, supplier: "" } : item));
  saveSupplierOptions(loadSavedSuppliers().filter((entry) => entry !== supplier));
  els.supplierFilter.value = "";
  saveItems();
  render();
}

function getVisibleItems() {
  const query = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const supplier = els.supplierFilter.value;
  const status = els.statusFilter.value;
  const sort = els.sortSelect.value;

  const filtered = items.filter((item) => {
    const haystack = `${item.name} ${item.sku} ${item.category} ${item.supplier} ${item.location} ${item.note}`.toLowerCase();
    const matchesQuery = haystack.includes(query);
    const matchesCategory = !category || item.category === category;
    const matchesSupplier = !supplier || item.supplier === supplier;
    const stock = Number(item.stock);
    const reorderPoint = Number(item.reorderPoint);
    const matchesStatus =
      status === "all" ||
      (status === "low" && reorderPoint > 0 && stock <= reorderPoint) ||
      (status === "out" && stock === 0);

    return matchesQuery && matchesCategory && matchesSupplier && matchesStatus;
  });

  return filtered.sort((a, b) => {
    if (sort === "stockAsc") return Number(a.stock) - Number(b.stock);
    if (sort === "stockDesc") return Number(b.stock) - Number(a.stock);
    if (sort === "valueDesc") {
      return Number(b.stock) * Number(b.unitPrice) - Number(a.stock) * Number(a.unitPrice);
    }
    return a.name.localeCompare(b.name, "ja");
  });
}

function renderCheckLocations() {
  const current = els.checkLocationFilter.value;
  const locations = getStorageLocations();
  els.checkLocationFilter.innerHTML = '<option value="">すべて</option>';
  els.checkLocationLinks.innerHTML = "";

  locations.forEach((location) => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    els.checkLocationFilter.append(option);

    const link = document.createElement("a");
    link.href = buildCheckUrl(location);
    link.textContent = location;
    els.checkLocationLinks.append(link);
  });

  els.checkLocationFilter.value = locations.includes(current) ? current : "";
  updateCheckUrlPreview();
  updateCheckUrlPermission();
}

function getStorageLocations() {
  const customLocations = [...new Set(items.map((item) => normalizeLocation(item.location)).filter(Boolean))]
    .filter((location) => !storageLocationOptions.includes(location))
    .sort((a, b) => a.localeCompare(b, "ja"));
  return [...storageLocationOptions, ...customLocations];
}

function getCheckItems() {
  const location = els.checkLocationFilter.value;
  const query = els.checkSearchInput.value.trim().toLowerCase();
  return items
    .filter((item) => {
      const matchesLocation = !location || item.location === location;
      const haystack = `${item.name} ${item.category} ${item.supplier} ${item.note}`.toLowerCase();
      return matchesLocation && haystack.includes(query);
    })
    .sort((a, b) => {
      if (a.location !== b.location) return (a.location || "未設定").localeCompare(b.location || "未設定", "ja");
      return a.name.localeCompare(b.name, "ja");
    });
}

function renderCheckItems() {
  const visibleItems = getCheckItems();
  const location = els.checkLocationFilter.value;
  els.checkGrid.innerHTML = "";
  els.checkLocationTitle.textContent = location ? `${location} チェック` : "冷蔵庫チェック";
  els.checkResultCount.textContent = `${visibleItems.length}件を表示中`;
  els.checkEmptyState.hidden = visibleItems.length !== 0;

  visibleItems.forEach((item) => {
    const article = document.createElement("article");
    article.className = "check-card";
    article.innerHTML = `
      <div class="check-card-main">
        <button class="check-name-button" data-check-action="edit" data-id="${item.id}" type="button">
          ${escapeHtml(item.name)}
        </button>
        <span>${escapeHtml(item.location || "未設定")} / ${escapeHtml(item.category)}</span>
      </div>
      <div class="check-stock">
        <button class="check-step-button decrease" data-check-action="decrease" data-id="${item.id}" type="button">-1</button>
        <strong>${formatQuantity(item.stock)}<small>${escapeHtml(item.unit)}</small></strong>
        <button class="check-step-button increase" data-check-action="increase" data-id="${item.id}" type="button">+1</button>
      </div>
      <div class="check-card-actions">
        <button class="ghost-button" data-check-action="set" data-id="${item.id}" type="button">数を入力</button>
        <button class="ghost-button" data-check-action="use" data-id="${item.id}" type="button">使用</button>
        <button class="ghost-button" data-check-action="receive" data-id="${item.id}" type="button">納品</button>
      </div>
    `;
    els.checkGrid.append(article);
  });
}

function buildCheckUrl(location) {
  const url = new URL(window.location.href);
  url.searchParams.set("view", "check");
  if (location) {
    url.searchParams.set("location", location);
  } else {
    url.searchParams.delete("location");
  }
  return url.toString();
}

function updateCheckUrlPreview() {
  const location = els.checkLocationFilter.value;
  els.checkUrlPreview.textContent = buildCheckUrl(location);
}

function canManageCheckUrls() {
  return currentUser?.email === CHECK_URL_MANAGER_EMAIL;
}

function updateCheckUrlPermission() {
  const canManage = canManageCheckUrls();
  els.copyCheckUrl.hidden = !canManage;
  els.checkUrlPreview.hidden = !canManage;
  els.checkLocationLinks.hidden = true;
}

function updateCheckUrlState() {
  updateCheckUrlPreview();
  const url = buildCheckUrl(els.checkLocationFilter.value);
  window.history.replaceState(null, "", url);
}

async function copyCheckUrl() {
  if (!canManageCheckUrls()) {
    alert("このURLコピー機能は管理者のみ利用できます。");
    return;
  }

  const url = buildCheckUrl(els.checkLocationFilter.value);
  try {
    await navigator.clipboard.writeText(url);
    alert("この場所のURLをコピーしました。QRコード作成時に使えます。");
  } catch {
    window.prompt("このURLをコピーしてください。", url);
  }
}

function applyInitialViewFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  const location = params.get("location");
  if (location) els.checkLocationFilter.value = location;
  if (view === "check" || location) {
    switchView("check");
    renderCheckItems();
    updateCheckUrlPreview();
  }
}

function switchView(view) {
  els.tabButtons.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  els.viewPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === view));
  const titles = {
    inventory: "THE PORT 在庫管理",
    check: "冷蔵庫チェック",
    costing: "THE PORT原価"
  };
  els.appTitle.textContent = titles[view] ?? titles.inventory;
  document.title = titles[view] ?? titles.inventory;
  els.summaryGrid.hidden = view === "check";
}

function renderTable(visibleItems) {
  els.table.innerHTML = "";
  els.resultCount.textContent = `${visibleItems.length}件を表示中`;
  els.emptyState.hidden = items.length !== 0;

  visibleItems.forEach((item) => {
    const stock = Number(item.stock);
    const reorderPoint = Number(item.reorderPoint);
    const isLow = reorderPoint > 0 && stock <= reorderPoint;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="product-main">
          <button class="product-name-button" data-action="edit" data-id="${item.id}" type="button" title="商品を編集">
            ${escapeHtml(item.name)}
          </button>
          <span class="sku">${escapeHtml(item.sku)} / ${escapeHtml(item.location || "未設定")}</span>
          ${item.note ? `<span class="note">${escapeHtml(item.note)}</span>` : ""}
        </div>
      </td>
      <td>${escapeHtml(item.category)}</td>
      <td>${escapeHtml(item.supplier || "未設定")}</td>
      <td><span class="stock-badge ${isLow ? "low" : ""}">${formatQuantity(stock)} ${escapeHtml(item.unit)}</span></td>
      <td>
        <div class="ideal-stock">
          <span>平日 ${formatQuantity(item.idealWeekdayStock)} ${escapeHtml(item.unit)}</span>
          <span>土日 ${formatQuantity(item.idealWeekendStock)} ${escapeHtml(item.unit)}</span>
        </div>
      </td>
      <td>${formatQuantity(item.reorderPoint)} ${escapeHtml(item.unit)}</td>
      <td>${unitPriceYen.format(Number(item.unitPrice))}</td>
      <td>${Number(item.gramPrice) > 0 ? gramPriceYen.format(Number(item.gramPrice)) : "-"}</td>
      <td>
        <div class="row-actions">
          <button class="action-button receive" data-action="receive" data-id="${item.id}" title="仕入れを追加">仕入</button>
          <button class="action-button use" data-action="use" data-id="${item.id}" title="使用分を減らす">使用</button>
          <button class="icon-button" data-action="edit" data-id="${item.id}" title="編集" aria-label="編集">✎</button>
          <button class="icon-button" data-action="delete" data-id="${item.id}" title="削除" aria-label="削除">×</button>
        </div>
      </td>
    `;
    els.table.append(row);
  });
}

function renderCostings() {
  const visibleCostings = getVisibleCostings();
  els.costingGrid.innerHTML = "";
  els.costingResultCount.textContent = `${visibleCostings.length}件を表示中`;
  els.costingEmptyState.hidden = costings.length !== 0;

  visibleCostings.forEach((costing) => {
    const summary = calculateCosting(costing);
    const isPrep = costing.category === "PREP";
    const article = document.createElement("article");
    article.className = "costing-card";
    article.innerHTML = `
      <div class="costing-card-header">
        <button class="costing-title-button" data-costing-action="toggle" data-id="${costing.id}" type="button" aria-expanded="false">
          <h3>${escapeHtml(costing.name)}</h3>
          <span class="costing-category-badge">${escapeHtml(formatCostingCategory(costing.category))}</span>
          ${costing.note ? `<p>${escapeHtml(costing.note)}</p>` : ""}
        </button>
        <div class="row-actions">
          <button class="icon-button" data-costing-action="move-up" data-id="${costing.id}" title="上へ移動" aria-label="上へ移動">↑</button>
          <button class="icon-button" data-costing-action="move-down" data-id="${costing.id}" title="下へ移動" aria-label="下へ移動">↓</button>
          ${isPrep ? `<button class="icon-button" data-costing-action="sync-item" data-id="${costing.id}" title="在庫へ反映" aria-label="在庫へ反映">↻</button>` : ""}
          <button class="icon-button" data-costing-action="edit" data-id="${costing.id}" title="編集" aria-label="編集">✎</button>
          <button class="icon-button" data-costing-action="delete" data-id="${costing.id}" title="削除" aria-label="削除">×</button>
        </div>
      </div>
      <div class="costing-metrics">
        <div>
          <span>${isPrep ? "g単価" : "1食原価"}</span>
          <strong>${yen.format(summary.costPerServing)}</strong>
        </div>
        <div>
          <span>${isPrep ? "仕上がり量" : "販売価格"}</span>
          <strong>${isPrep ? `${formatQuantity(costing.yieldCount)}g` : costing.salePrice > 0 ? yen.format(costing.salePrice) : "-"}</strong>
        </div>
        <div class="${!isPrep && summary.rate >= 35 ? "high-rate" : ""}">
          <span>${isPrep ? "総原価" : "原価率"}</span>
          <strong>${isPrep ? yen.format(summary.totalCost) : formatRate(summary.rate)}</strong>
        </div>
        <div>
          <span>${isPrep ? "在庫反映" : "粗利"}</span>
          <strong>${isPrep ? "仕込み品" : costing.salePrice > 0 ? yen.format(costing.salePrice - summary.costPerServing) : "-"}</strong>
        </div>
      </div>
      <div class="ingredient-list" hidden>
        ${summary.lines.length ? summary.lines.map(renderIngredientLine).join("") : '<p class="muted-text">材料が登録されていません。</p>'}
      </div>
    `;
    els.costingGrid.append(article);
  });
}

function formatCostingCategory(category) {
  const labels = {
    FOOD: "FOOD",
    DESERT: "DESERT",
    DRINK: "DRINK",
    PREP: "仕込み品"
  };
  return labels[category] ?? category;
}

function renderIngredientLine(line) {
  return `
    <div class="ingredient-line ${line.item || line.name ? "" : "missing"}">
      <span>${escapeHtml(line.item?.name ?? line.name ?? "材料名未設定")}</span>
      <span>${formatQuantity(line.quantity)} ${escapeHtml(line.unit || line.item?.unit || "")}</span>
      <strong>${yen.format(line.cost)}</strong>
    </div>
  `;
}

function getVisibleCostings() {
  const query = els.costingSearchInput.value.trim().toLowerCase();
  const category = els.costingCategoryFilter.value;
  const status = els.costingStatusFilter.value;
  const sort = els.costingSortSelect.value;

  const filtered = costings.filter((costing) => {
    const summary = calculateCosting(costing);
    const haystack = `${costing.name} ${costing.note}`.toLowerCase();
    const matchesQuery = haystack.includes(query);
    const matchesCategory = category === "all" || costing.category === category;
    const matchesStatus =
      status === "all" ||
      (status === "high" && summary.rate >= 35) ||
      (status === "unset" && Number(costing.salePrice) <= 0);
    return matchesQuery && matchesCategory && matchesStatus;
  });

  return filtered.sort((a, b) => {
    const summaryA = calculateCosting(a);
    const summaryB = calculateCosting(b);
    if (sort === "manual") return compareCostingSortOrder(a, b);
    if (sort === "costDesc") return summaryB.costPerServing - summaryA.costPerServing;
    if (sort === "rateDesc") return summaryB.rate - summaryA.rate;
    return a.name.localeCompare(b.name, "ja");
  });
}

function compareCostingSortOrder(a, b) {
  const orderA = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : Number.MAX_SAFE_INTEGER;
  const orderB = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;
  return a.name.localeCompare(b.name, "ja");
}

function calculateCosting(costing) {
  const lines = costing.ingredients.map((ingredient) => {
    const item = items.find((entry) => entry.id === ingredient.itemId);
    const itemCostingPrice = getItemCostingUnitPrice(item);
    const unitPrice = itemCostingPrice > 0 ? itemCostingPrice : Number(ingredient.unitPrice) > 0 ? Number(ingredient.unitPrice) : 0;
    const cost = unitPrice > 0 ? Number(ingredient.quantity) * unitPrice : Number(ingredient.cost) || 0;
    return { ...ingredient, item, unitPrice, cost };
  });
  const totalCost = lines.reduce((sum, line) => sum + line.cost, 0);
  const costPerServing = totalCost / Math.max(1, Number(costing.yieldCount) || 1);
  const rate = Number(costing.salePrice) > 0 ? (costPerServing / Number(costing.salePrice)) * 100 : 0;
  return { lines, totalCost, costPerServing, rate };
}

function getItemCostingUnitPrice(item) {
  if (!item) return 0;
  const gramPrice = Number(item.gramPrice) || 0;
  return gramPrice > 0 ? gramPrice : Number(item.unitPrice) || 0;
}

function formatRate(value) {
  if (!Number.isFinite(value) || value <= 0) return "-";
  return `${quantityFormat.format(value)}%`;
}

function formatQuantity(value) {
  return quantityFormat.format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openForm(item = null) {
  editingId = item?.id ?? null;
  els.formTitle.textContent = item ? "食材・資材を編集" : "食材・資材を追加";
  els.form.reset();

  if (item) {
    Object.entries(item).forEach(([key, value]) => {
      const input = document.querySelector(`#${key}`);
      if (input) input.value = value;
    });
  } else {
    document.querySelector("#category").value = "野菜";
    document.querySelector("#unit").value = "kg";
  }

  els.dialog.showModal();
  document.querySelector("#name").focus();
}

function closeForm() {
  els.dialog.close();
  editingId = null;
}

function handleFormSubmit(event) {
  event.preventDefault();
  const formItem = normalizeItem({
    id: editingId ?? crypto.randomUUID(),
    name: document.querySelector("#name").value.trim(),
    sku: document.querySelector("#sku").value.trim(),
    category: document.querySelector("#category").value,
    supplier: document.querySelector("#supplier").value.trim(),
    location: document.querySelector("#location").value.trim(),
    unit: document.querySelector("#unit").value.trim(),
    stock: document.querySelector("#stock").value,
    idealWeekdayStock: document.querySelector("#idealWeekdayStock").value,
    idealWeekendStock: document.querySelector("#idealWeekendStock").value,
    reorderPoint: document.querySelector("#reorderPoint").value,
    unitPrice: document.querySelector("#unitPrice").value,
    note: document.querySelector("#note").value.trim()
  });

  if (editingId) {
    items = items.map((item) => (item.id === editingId ? formItem : item));
  } else {
    items.push(formItem);
  }

  saveItems();
  closeForm();
  render();
}

function openMovementForm(id, type) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  els.movementForm.reset();
  els.movementItemId.value = id;
  els.movementType.value = type;
  els.movementTitle.textContent = type === "receive" ? "仕入れを追加" : "使用分を減らす";
  els.movementTarget.textContent = `${item.name} / 現在庫 ${formatQuantity(item.stock)} ${item.unit}`;
  els.movementQuantity.placeholder = item.unit;
  els.movementMemo.placeholder = type === "receive" ? "例: 業者から仕入れ" : "例: ランチ営業で使用";
  els.movementDialog.showModal();
  els.movementQuantity.focus();
}

function closeMovementForm() {
  els.movementDialog.close();
}

function openCostingForm(costing = null) {
  editingCostingId = costing?.id ?? null;
  els.costingFormTitle.textContent = costing ? "メニュー原価を編集" : "メニュー原価を追加";
  els.costingForm.reset();
  els.ingredientRows.innerHTML = "";
  els.costingYield.value = costing?.yieldCount ?? 1;
  els.costingName.value = costing?.name ?? "";
  els.costingCategory.value = costing?.category ?? "FOOD";
  els.costingSalePrice.value = costing?.salePrice || "";
  els.costingNote.value = costing?.note ?? "";

  const ingredients = costing?.ingredients?.length ? costing.ingredients : [{ itemId: "", quantity: 1, memo: "" }];
  ingredients.forEach((ingredient) => addIngredientRow(ingredient));
  updateCostingPreview();
  els.costingDialog.showModal();
  els.costingName.focus();
}

function closeCostingForm() {
  els.costingDialog.close();
  editingCostingId = null;
}

function addIngredientRow(ingredient = { itemId: "", quantity: 1, memo: "" }) {
  const row = document.createElement("div");
  const itemListId = `ingredient-items-${crypto.randomUUID()}`;
  row.className = "ingredient-row";
  row.innerHTML = `
    <label>
      紐付け品目
      <input class="ingredient-item-search" list="${itemListId}" placeholder="商品名で検索">
      <datalist id="${itemListId}">
        ${items.map((item) => `<option value="${escapeHtml(getIngredientItemLabel(item))}"></option>`).join("")}
      </datalist>
      <input class="ingredient-item" type="hidden">
    </label>
    <label>
      材料名
      <input class="ingredient-name" maxlength="80" placeholder="Excel材料名">
    </label>
    <label>
      使用量
      <input class="ingredient-quantity" type="number" min="0.01" step="0.01" required>
    </label>
    <label>
      単位
      <select class="ingredient-unit">
        <option value="枚">枚</option>
        <option value="g">g</option>
        <option value="玉">玉</option>
        <option value="個">個</option>
        <option value="人前">人前</option>
        <option value="食分">食分</option>
      </select>
    </label>
    <label>
      単価
      <input class="ingredient-unit-price" type="number" min="0" step="0.0001" placeholder="在庫未紐づけ時">
    </label>
    <div class="ingredient-row-total" aria-live="polite">
      <span>小計</span>
      <strong>¥0</strong>
    </div>
    <input class="ingredient-cost" type="hidden">
    <input class="ingredient-memo" type="hidden">
    <button class="icon-button remove-ingredient" type="button" title="材料を削除" aria-label="材料を削除">×</button>
  `;
  row.querySelector(".ingredient-item").value = ingredient.itemId ?? "";
  row.querySelector(".ingredient-item-search").value = getIngredientSearchValue(ingredient.itemId);
  row.querySelector(".ingredient-name").value = ingredient.name ?? "";
  row.querySelector(".ingredient-quantity").value = ingredient.quantity ?? 1;
  row.querySelector(".ingredient-unit-price").value = ingredient.unitPrice || "";
  setIngredientUnit(row.querySelector(".ingredient-unit"), ingredient.unit ?? "g");
  row.querySelector(".ingredient-cost").value = ingredient.cost || "";
  row.querySelector(".ingredient-memo").value = ingredient.memo ?? "";
  els.ingredientRows.append(row);
  updateIngredientRowTotal(row);
}

function getIngredientItemLabel(item) {
  const gramPrice = Number(item.gramPrice) || 0;
  const priceLabel = gramPrice > 0
    ? `g単価 ${gramPriceYen.format(gramPrice)}`
    : `単価 ${unitPriceYen.format(Number(item.unitPrice))}`;
  return `${item.name} / ${item.unit} / ${priceLabel}`;
}

function getIngredientSearchValue(itemId) {
  const item = items.find((entry) => entry.id === itemId);
  return item ? getIngredientItemLabel(item) : "";
}

function findIngredientItemBySearch(value) {
  const searchValue = value.trim();
  if (!searchValue) return null;
  return items.find((item) => getIngredientItemLabel(item) === searchValue) ??
    items.find((item) => item.name === searchValue) ??
    null;
}

function setIngredientUnit(select, unit) {
  const normalizedUnit = normalizeCostingUnit(unit);
  select.value = normalizedUnit;
}

function normalizeCostingUnit(unit) {
  if (unit === "g" || unit === "枚" || unit === "玉" || unit === "個" || unit === "人前" || unit === "食分") return unit;
  if (["本", "pac", "缶", "ケース", "束"].includes(unit)) return "枚";
  return "g";
}

function syncIngredientRowFromItem(row) {
  const item = items.find((entry) => entry.id === row.querySelector(".ingredient-item").value);
  if (!item) return;

  row.querySelector(".ingredient-name").value = item.name;
  const unitPriceInput = row.querySelector(".ingredient-unit-price");
  const costingUnitPrice = getItemCostingUnitPrice(item);
  unitPriceInput.value = costingUnitPrice || "";
  setIngredientUnit(row.querySelector(".ingredient-unit"), Number(item.gramPrice) > 0 ? "g" : item.unit);
  row.querySelector(".ingredient-cost").value = "";
  updateIngredientRowTotal(row);
}

function syncIngredientRowFromSearch(row) {
  const searchInput = row.querySelector(".ingredient-item-search");
  const itemIdInput = row.querySelector(".ingredient-item");
  const item = findIngredientItemBySearch(searchInput.value);

  itemIdInput.value = item?.id ?? "";
  if (!item) {
    updateIngredientRowTotal(row);
    return;
  }

  searchInput.value = getIngredientItemLabel(item);
  syncIngredientRowFromItem(row);
}

function updateIngredientRowTotal(row) {
  const quantity = Number(row.querySelector(".ingredient-quantity").value) || 0;
  const enteredUnitPrice = Number(row.querySelector(".ingredient-unit-price").value) || 0;
  const item = items.find((entry) => entry.id === row.querySelector(".ingredient-item").value);
  const itemCostingPrice = getItemCostingUnitPrice(item);
  const unitPrice = itemCostingPrice > 0 ? itemCostingPrice : enteredUnitPrice;
  const total = quantity * unitPrice;
  row.querySelector(".ingredient-row-total strong").textContent = yen.format(total);
}

function getCostingFormIngredients() {
  return [...els.ingredientRows.querySelectorAll(".ingredient-row")]
    .map((row) => normalizeIngredient({
      itemId: row.querySelector(".ingredient-item").value,
      name: row.querySelector(".ingredient-name").value.trim(),
      quantity: row.querySelector(".ingredient-quantity").value,
      unit: row.querySelector(".ingredient-unit").value,
      unitPrice: row.querySelector(".ingredient-unit-price").value,
      cost: row.querySelector(".ingredient-cost").value,
      memo: row.querySelector(".ingredient-memo").value.trim()
    }))
    .filter((ingredient) => (ingredient.itemId || ingredient.name) && (ingredient.quantity > 0 || ingredient.cost > 0));
}

function updateCostingPreview() {
  els.ingredientRows.querySelectorAll(".ingredient-row").forEach(updateIngredientRowTotal);
  const draft = normalizeCosting({
    id: editingCostingId ?? "preview",
    name: els.costingName.value,
    category: els.costingCategory.value,
    salePrice: els.costingSalePrice.value,
    yieldCount: els.costingYield.value,
    note: els.costingNote.value,
    ingredients: getCostingFormIngredients()
  });
  const summary = calculateCosting(draft);
  els.costingPreviewCost.textContent = yen.format(summary.costPerServing);
  els.costingPreviewRate.textContent = draft.category === "PREP" ? `${yen.format(summary.totalCost)} / ${formatQuantity(draft.yieldCount)}g` : formatRate(summary.rate);
}

function handleCostingSubmit(event) {
  event.preventDefault();
  const existingCosting = costings.find((costing) => costing.id === editingCostingId);
  const formCosting = normalizeCosting({
    id: editingCostingId ?? crypto.randomUUID(),
    name: els.costingName.value.trim(),
    category: els.costingCategory.value,
    salePrice: els.costingSalePrice.value,
    yieldCount: els.costingYield.value,
    sortOrder: existingCosting?.sortOrder ?? costings.length,
    note: els.costingNote.value.trim(),
    ingredients: getCostingFormIngredients()
  });

  if (formCosting.ingredients.length === 0) {
    alert("使用材料を1つ以上登録してください。");
    return;
  }

  if (editingCostingId) {
    costings = costings.map((costing) => (costing.id === editingCostingId ? formCosting : costing));
  } else {
    costings.push(formCosting);
  }

  saveCostings();
  closeCostingForm();
  renderCostings();
}

function deleteCosting(id) {
  const costing = costings.find((entry) => entry.id === id);
  if (!costing || !confirm(`${costing.name}を削除しますか？`)) return;
  costings = costings.filter((entry) => entry.id !== id);
  saveCostings();
  deleteRemoteCosting(id);
  renderCostings();
}

function moveCosting(id, direction) {
  els.costingSortSelect.value = "manual";
  applyCostingSortOrder();
  const visibleCostings = getVisibleCostings();
  const index = visibleCostings.findIndex((costing) => costing.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  const current = visibleCostings[index];
  const target = visibleCostings[targetIndex];
  if (!current || !target) return;

  const currentOrder = current.sortOrder;
  current.sortOrder = target.sortOrder;
  target.sortOrder = currentOrder;
  costings = costings.map((costing) => {
    if (costing.id === current.id) return current;
    if (costing.id === target.id) return target;
    return costing;
  });
  saveCostings();
  renderCostings();
}

function syncPrepCostingToInventory(id) {
  const costing = costings.find((entry) => entry.id === id);
  if (!costing) return;

  if (costing.category !== "PREP") {
    alert("仕込み品カテゴリのみ在庫へ反映できます。");
    return;
  }

  const summary = calculateCosting(costing);
  if (!costing.name || summary.costPerServing <= 0) {
    alert("仕込み品名、材料、仕上がり量を確認してください。");
    return;
  }

  const existing = items.find((item) => item.name === costing.name && item.category === "仕込み品");
  const inventoryItem = normalizeItem({
    ...(existing ?? {}),
    id: existing?.id ?? `prep-${costing.id}`,
    name: costing.name,
    sku: existing?.sku || `PREP-${costing.name}`,
    category: "仕込み品",
    supplier: existing?.supplier ?? "自家製",
    location: existing?.location ?? "",
    unit: "g",
    stock: existing?.stock ?? 0,
    idealWeekdayStock: existing?.idealWeekdayStock ?? 0,
    idealWeekendStock: existing?.idealWeekendStock ?? 0,
    reorderPoint: existing?.reorderPoint ?? 0,
    unitPrice: Number(summary.costPerServing.toFixed(4)),
    note: `仕込み品原価から反映 / 仕上がり量: ${formatQuantity(costing.yieldCount)}g / 総原価: ${yen.format(summary.totalCost)}`
  });

  if (existing) {
    items = items.map((item) => (item.id === existing.id ? inventoryItem : item));
  } else {
    items.push(inventoryItem);
  }

  saveItems();
  render();
  alert(`${costing.name}を在庫マスターへ反映しました。`);
}

function applyCostingSortOrder() {
  costings = [...costings]
    .sort(compareCostingSortOrder)
    .map((costing, index) => ({ ...costing, sortOrder: index }));
}

async function deleteRemoteCosting(id) {
  if (!supabaseClient || !currentUser) return;
  const { error } = await supabaseClient
    .from("menu_costings")
    .delete()
    .eq("id", id);

  if (error) alert(`原価計算データの削除に失敗しました: ${error.message}`);
}

function handleMovementSubmit(event) {
  event.preventDefault();
  const id = els.movementItemId.value;
  const type = els.movementType.value;
  const quantity = Number(els.movementQuantity.value);
  const memo = els.movementMemo.value.trim();

  if (!id || !type || quantity <= 0) return;

  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  const delta = type === "receive" ? quantity : -quantity;
  items = items.map((entry) => {
    if (entry.id !== id) return entry;
    return {
      ...entry,
      stock: Math.max(0, Number(entry.stock) + delta)
    };
  });

  history.unshift({
    id: crypto.randomUUID(),
    itemId: id,
    itemName: item.name,
    type,
    quantity,
    unit: item.unit,
    memo,
    createdAt: new Date().toISOString()
  });

  saveItems();
  saveHistory();
  closeMovementForm();
  render();
}

function applyStockChange(id, delta, memo) {
  const item = items.find((entry) => entry.id === id);
  if (!item || !Number.isFinite(delta) || delta === 0) return;

  const nextStock = Math.max(0, Number(item.stock) + delta);
  const appliedQuantity = Math.abs(nextStock - Number(item.stock));
  if (appliedQuantity === 0) return;

  items = items.map((entry) => (entry.id === id ? { ...entry, stock: nextStock } : entry));
  history.unshift({
    id: crypto.randomUUID(),
    itemId: id,
    itemName: item.name,
    type: delta > 0 ? "receive" : "use",
    quantity: appliedQuantity,
    unit: item.unit,
    memo,
    createdAt: new Date().toISOString()
  });

  saveItems();
  saveHistory();
  render();
}

function setCheckStock(id) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  const value = window.prompt(`${item.name} の現在庫を入力してください。`, String(Number(item.stock) || 0));
  if (value === null) return;
  const nextStock = Number(value);
  if (!Number.isFinite(nextStock) || nextStock < 0) {
    alert("0以上の数字を入力してください。");
    return;
  }

  const delta = nextStock - Number(item.stock);
  applyStockChange(id, delta, "冷蔵庫チェックで在庫数を修正");
}

function deleteItem(id) {
  const item = items.find((entry) => entry.id === id);
  if (!item || !confirm(`${item.name}を削除しますか？`)) return;
  items = items.filter((entry) => entry.id !== id);
  saveItems();
  deleteRemoteItem(id);
  render();
}

async function deleteRemoteItem(id) {
  if (!supabaseClient || !currentUser) return;
  const { error } = await supabaseClient
    .from("inventory_items")
    .delete()
    .eq("id", id);

  if (error) alert(`削除に失敗しました: ${error.message}`);
}

function exportCsv() {
  const rows = [
    ["個別商品名", "管理番号", "カテゴリ", "業者名", "保管場所", "単位", "現在庫", "適正在庫 平日", "適正在庫 土日", "発注点", "単価", "g単価", "メモ"],
    ...items.map((item) => [
      item.name,
      item.sku,
      item.category,
      item.supplier,
      item.location,
      item.unit,
      item.stock,
      item.idealWeekdayStock,
      item.idealWeekendStock,
      item.reorderPoint,
      item.unitPrice,
      item.gramPrice,
      item.note
    ])
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `restaurant-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportCostingCsv() {
  const rows = [
    ["メニュー名", "カテゴリー", "販売価格", "仕込み単位/仕上がり量g", "1食原価/g単価", "原価率", "粗利/総原価", "材料", "メモ"],
    ...costings.map((costing) => {
      const summary = calculateCosting(costing);
      const isPrep = costing.category === "PREP";
      return [
        costing.name,
        formatCostingCategory(costing.category),
        costing.salePrice,
        costing.yieldCount,
        Math.round(summary.costPerServing),
        isPrep ? "" : formatRate(summary.rate),
        isPrep ? Math.round(summary.totalCost) : costing.salePrice > 0 ? Math.round(costing.salePrice - summary.costPerServing) : "",
        summary.lines.map((line) => `${line.item?.name ?? line.name ?? "削除済み"} ${formatQuantity(line.quantity)}${line.unit || line.item?.unit || ""}`).join(" / "),
        costing.note
      ];
    })
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `menu-costings-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function importCsv(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const lines = String(reader.result).trim().split(/\r?\n/).slice(1);
    const imported = lines.map(parseCsvLine).filter((row) => row.length >= 9).map((row) => normalizeItem({
      id: crypto.randomUUID(),
      name: row[0],
      sku: row[1],
      category: row[2],
      supplier: row[3],
      location: row[4],
      unit: row[5],
      stock: row[6],
      idealWeekdayStock: row.length >= 12 ? row[7] : 0,
      idealWeekendStock: row.length >= 12 ? row[8] : 0,
      reorderPoint: row.length >= 12 ? row[9] : row[7],
      unitPrice: row.length >= 12 ? row[10] : row[8],
      gramPrice: row.length >= 13 ? row[11] : "",
      note: row.length >= 13 ? row[12] || "" : row.length >= 12 ? row[11] || "" : row[9] || ""
    }));

    if (imported.length === 0) {
      alert("取り込める在庫データが見つかりませんでした。");
      return;
    }

    items = imported;
    saveItems();
    render();
  };
  reader.readAsText(file, "utf-8");
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

els.openForm.addEventListener("click", () => openForm());
els.cancelForm.addEventListener("click", closeForm);
els.form.addEventListener("submit", handleFormSubmit);
els.cancelMovement.addEventListener("click", closeMovementForm);
els.movementForm.addEventListener("submit", handleMovementSubmit);
els.addSupplier.addEventListener("click", addSupplier);
els.deleteSupplier.addEventListener("click", deleteSupplier);
els.loginButton.addEventListener("click", handleLogin);
els.logoutButton.addEventListener("click", handleLogout);
els.refreshData.addEventListener("click", refreshFromCloud);
els.exportCsv.addEventListener("click", exportCsv);
els.openCostingForm.addEventListener("click", () => openCostingForm());
els.cancelCostingForm.addEventListener("click", closeCostingForm);
els.costingForm.addEventListener("submit", handleCostingSubmit);
els.addIngredientRow.addEventListener("click", () => {
  addIngredientRow();
  updateCostingPreview();
});
els.exportCostingCsv.addEventListener("click", exportCostingCsv);
els.copyCheckUrl.addEventListener("click", copyCheckUrl);
els.importCsv.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importCsv(file);
  event.target.value = "";
});

[els.searchInput, els.categoryFilter, els.supplierFilter, els.statusFilter, els.sortSelect].forEach((element) => {
  element.addEventListener("input", render);
});

[els.checkLocationFilter, els.checkSearchInput].forEach((element) => {
  element.addEventListener("input", () => {
    if (element === els.checkLocationFilter) updateCheckUrlState();
    renderCheckItems();
  });
});

[els.costingSearchInput, els.costingCategoryFilter, els.costingStatusFilter, els.costingSortSelect].forEach((element) => {
  element.addEventListener("input", renderCostings);
});

[els.costingName, els.costingCategory, els.costingSalePrice, els.costingYield, els.costingNote].forEach((element) => {
  element.addEventListener("input", updateCostingPreview);
});

els.ingredientRows.addEventListener("input", (event) => {
  if (event.target.classList.contains("ingredient-quantity") || event.target.classList.contains("ingredient-unit-price")) {
    const row = event.target.closest(".ingredient-row");
    if (row) {
      row.querySelector(".ingredient-cost").value = "";
      updateIngredientRowTotal(row);
    }
  }
  if (event.target.classList.contains("ingredient-item-search")) {
    const row = event.target.closest(".ingredient-row");
    if (row) {
      row.querySelector(".ingredient-item").value = "";
      syncIngredientRowFromSearch(row);
    }
  }
  updateCostingPreview();
});
els.ingredientRows.addEventListener("change", (event) => {
  const row = event.target.closest(".ingredient-row");
  if (!row) return;
  if (event.target.classList.contains("ingredient-item-search")) syncIngredientRowFromSearch(row);
  if (event.target.classList.contains("ingredient-unit-price")) row.querySelector(".ingredient-cost").value = "";
  updateIngredientRowTotal(row);
  updateCostingPreview();
});
els.ingredientRows.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-ingredient");
  if (!button) return;
  const rows = els.ingredientRows.querySelectorAll(".ingredient-row");
  if (rows.length === 1) {
    rows[0].querySelector(".ingredient-item").value = "";
    rows[0].querySelector(".ingredient-item-search").value = "";
    rows[0].querySelector(".ingredient-name").value = "";
    rows[0].querySelector(".ingredient-quantity").value = 1;
    rows[0].querySelector(".ingredient-unit-price").value = "";
    rows[0].querySelector(".ingredient-unit").value = "g";
    rows[0].querySelector(".ingredient-cost").value = "";
    rows[0].querySelector(".ingredient-memo").value = "";
    updateIngredientRowTotal(rows[0]);
  } else {
    button.closest(".ingredient-row").remove();
  }
  updateCostingPreview();
});

els.tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    switchView(view);
    if (view === "check") updateCheckUrlState();
  });
});

els.clearFilters.addEventListener("click", () => {
  els.searchInput.value = "";
  els.categoryFilter.value = "";
  els.supplierFilter.value = "";
  els.statusFilter.value = "all";
  els.sortSelect.value = "name";
  render();
});

els.clearCostingFilters.addEventListener("click", () => {
  els.costingSearchInput.value = "";
  els.costingCategoryFilter.value = "all";
  els.costingStatusFilter.value = "all";
  els.costingSortSelect.value = "manual";
  renderCostings();
});

els.clearCheckFilters.addEventListener("click", () => {
  els.checkLocationFilter.value = "";
  els.checkSearchInput.value = "";
  updateCheckUrlState();
  renderCheckItems();
});

els.table.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const item = items.find((entry) => entry.id === id);

  if (action === "receive") openMovementForm(id, "receive");
  if (action === "use") openMovementForm(id, "use");
  if (action === "edit" && item) openForm(item);
  if (action === "delete") deleteItem(id);
});

els.checkGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-check-action]");
  if (!button) return;

  const { checkAction, id } = button.dataset;
  const item = items.find((entry) => entry.id === id);

  if (checkAction === "increase") applyStockChange(id, 1, "冷蔵庫チェックで+1");
  if (checkAction === "decrease") applyStockChange(id, -1, "冷蔵庫チェックで-1");
  if (checkAction === "set") setCheckStock(id);
  if (checkAction === "receive") openMovementForm(id, "receive");
  if (checkAction === "use") openMovementForm(id, "use");
  if (checkAction === "edit" && item) openForm(item);
});

els.costingGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-costing-action]");
  if (!button) return;

  const { costingAction, id } = button.dataset;
  const costing = costings.find((entry) => entry.id === id);

  if (costingAction === "toggle") toggleCostingDetails(button);
  if (costingAction === "move-up") moveCosting(id, "up");
  if (costingAction === "move-down") moveCosting(id, "down");
  if (costingAction === "sync-item") syncPrepCostingToInventory(id);
  if (costingAction === "edit" && costing) openCostingForm(costing);
  if (costingAction === "delete") deleteCosting(id);
});

function toggleCostingDetails(button) {
  const card = button.closest(".costing-card");
  const list = card?.querySelector(".ingredient-list");
  if (!list) return;

  const willOpen = list.hidden;
  list.hidden = !willOpen;
  button.setAttribute("aria-expanded", String(willOpen));
  card.classList.toggle("details-open", willOpen);
}

async function init() {
  if (!supabaseClient) await initSupabase();
  items = await loadItems();
  history = await loadHistory();
  costings = await loadCostings();
  render();
  applyInitialViewFromUrl();
}

async function handleLogin() {
  if (!supabaseClient) {
    alert("Supabase設定がまだ入っていません。supabase-config.jsを設定してください。");
    return;
  }

  const email = els.loginEmail.value.trim();
  const password = els.loginPassword.value;
  if (!email || !password) {
    alert("メールとパスワードを入力してください。");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    alert(`ログインできませんでした: ${error.message}`);
    return;
  }

  els.loginPassword.value = "";
}

async function handleLogout() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
  items = [];
  history = [];
  costings = [];
  render();
}

init();
