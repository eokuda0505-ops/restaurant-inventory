const STORAGE_KEY = "restaurant-inventory-items-v3";
const HISTORY_KEY = "restaurant-inventory-history-v3";
const SUPPLIER_KEY = "restaurant-inventory-suppliers-v1";
const COSTINGS_KEY = "restaurant-inventory-costings-v1";
const SUPPLIER_ORDER_SETTINGS_KEY = "restaurant-inventory-supplier-order-settings-v1";
const SELECTED_STORE_KEY = "restaurant-inventory-selected-store-v1";
const LANGUAGE_KEY = "restaurant-inventory-language-v1";

const defaultCategoryOptions = ["野菜", "果物", "肉類", "魚類", "冷凍物", "乾物", "資材", "乳製品、チーズ", "酒類", "仕込み品"];
const costingCategoryOptions = ["FOOD", "DESERT", "DRINK", "PREP"];
const defaultStorageLocationOptions = [
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
const defaultUnitOptions = ["個", "玉", "本", "pac", "缶", "ケース", "食分", "g", "kg", "ml", "L"];
const defaultStoreSettings = {
  appName: "在庫管理",
  businessName: "店舗",
  logoUrl: "",
  managerEmail: "",
  categories: defaultCategoryOptions,
  storageLocations: defaultStorageLocationOptions,
  units: defaultUnitOptions
};

let categoryOptions = [...defaultCategoryOptions];
let storageLocationOptions = [...defaultStorageLocationOptions];
let unitOptions = [...defaultUnitOptions];
let storeSettings = { ...defaultStoreSettings };
let availableStores = [];
let currentStore = null;
let currentStoreRole = "staff";
let tenancyEnabled = false;

let items = [];
let history = [];
let costings = [];
let supplierOrderSettings = [];
let orderQuantities = {};
let editingId = null;
let editingCostingId = null;
let supabaseClient = null;
let currentUser = null;
let syncTimer = null;
let saveInProgress = 0;
let suppressAutoRefreshUntil = 0;
let currentLanguage = localStorage.getItem(LANGUAGE_KEY) || "ja";

const uiText = {
  en: {
    "言語": "Language",
    "日本語": "Japanese",
    "ログイン": "Log in",
    "ログアウト": "Log out",
    "メール": "Email",
    "電話": "Phone",
    "その他": "Other",
    "閉じる": "Close",
    "未接続": "Disconnected",
    "未ログイン": "Not logged in",
    "Supabase未設定": "Supabase not set",
    "店舗": "Store",
    "店舗設定": "Store settings",
    "最新データを取得": "Refresh data",
    "CSV出力": "Export CSV",
    "CSV取込": "Import CSV",
    "食材・資材を追加": "Add item",
    "食材・資材を編集": "Edit item",
    "在庫管理": "Inventory",
    "冷蔵庫チェック": "Cold storage check",
    "発注": "Orders",
    "原価計算": "Costing",
    "登録品目": "Items",
    "総在庫量": "Total stock",
    "低在庫": "Low stock",
    "在庫金額": "Inventory value",
    "絞り込み": "Filters",
    "解除": "Clear",
    "検索": "Search",
    "カテゴリ": "Category",
    "カテゴリー": "Category",
    "業者": "Supplier",
    "業者追加": "Add supplier",
    "業者削除": "Delete supplier",
    "表示": "View",
    "店舗在庫一覧": "Inventory list",
    "商品名": "Item name",
    "分類": "Category",
    "在庫量": "Stock",
    "現在庫": "Current stock",
    "適正在庫": "Ideal stock",
    "適正在庫 平日": "Ideal weekday stock",
    "適正在庫 土日": "Ideal weekend stock",
    "発注点": "Reorder point",
    "単価": "Unit price",
    "g単価": "g price",
    "操作": "Actions",
    "チェック場所": "Check location",
    "保管場所": "Storage location",
    "この場所のURLをコピー": "Copy this location URL",
    "チェック対象がありません": "No check items",
    "商品編集で「保管場所」を入れると、この画面に表示されます。": "Items appear here after a storage location is set.",
    "発注条件": "Order conditions",
    "平日": "Weekday",
    "土日": "Weekend",
    "発注文をコピー": "Copy order text",
    "業者設定": "Supplier settings",
    "メール下書き": "Email draft",
    "発注CSV": "Order CSV",
    "発注済みにする": "Mark ordered",
    "業者別 発注候補": "Order suggestions by supplier",
    "発注候補がありません": "No order suggestions",
    "発注点を下回った商品がここに表示されます。": "Items below reorder point appear here.",
    "メニュー": "Menu",
    "原価率": "Cost rate",
    "メニュー原価を追加": "Add menu costing",
    "メニュー原価を編集": "Edit menu costing",
    "原価一覧CSV": "Costing CSV",
    "メニュー原価": "Menu costing",
    "メニュー原価がありません": "No menu costings",
    "「メニュー原価を追加」から、料理やドリンクごとの材料を登録してください。": "Add ingredients for dishes and drinks from Add menu costing.",
    "個別商品名": "Item name",
    "管理番号": "SKU",
    "業者名": "Supplier",
    "単位": "Unit",
    "メモ": "Memo",
    "キャンセル": "Cancel",
    "保存": "Save",
    "在庫を更新": "Update stock",
    "数量": "Quantity",
    "内容": "Details",
    "反映": "Apply",
    "管理者設定": "Admin settings",
    "店舗名": "Store name",
    "画面名": "Screen name",
    "会社・ブランド名": "Company / Brand",
    "管理者メール": "Admin email",
    "ロゴ画像URL（任意）": "Logo image URL (optional)",
    "カテゴリ（1行に1つ）": "Categories (one per line)",
    "保管場所（1行に1つ）": "Storage locations (one per line)",
    "単位（1行に1つ）": "Units (one per line)",
    "この設定は現在選択している店舗だけに反映されます。": "These settings apply only to the selected store.",
    "QR印刷": "Print QR",
    "業者発注設定": "Supplier order settings",
    "発注方法": "Order method",
    "連絡先": "Contact",
    "締切時間": "Cutoff time",
    "納品曜日": "Delivery days",
    "最小発注・注意": "Minimum / Notes",
    "発注メモ": "Order memo",
    "設定削除": "Delete settings",
    "メニュー名": "Menu name",
    "販売価格": "Sale price",
    "仕込み単位 / 仕上がり量g": "Batch size / finished grams",
    "使用材料": "Ingredients",
    "材料を追加": "Add ingredient",
    "1食/g単価": "Per serving / g price",
    "1食原価": "Cost per serving",
    "仕上がり量": "Finished amount",
    "総原価": "Total cost",
    "在庫反映": "Inventory sync",
    "粗利": "Gross profit",
    "材料が登録されていません。": "No ingredients registered.",
    "材料名未設定": "Ingredient name unset",
    "原価": "Cost",
    "指定順": "Manual order",
    "商品名順": "Item name order",
    "在庫が少ない順": "Lowest stock first",
    "在庫が多い順": "Highest stock first",
    "在庫金額が高い順": "Highest value first",
    "メニュー名順": "Menu name order",
    "原価が高い順": "Highest cost first",
    "原価率が高い順": "Highest cost rate first",
    "すべて": "All",
    "低在庫のみ": "Low stock only",
    "在庫切れのみ": "Out of stock only",
    "35%以上": "35% or higher",
    "販売価格未設定": "Sale price not set",
    "未設定": "Unset",
    "上へ": "Up",
    "下へ": "Down",
    "数を入力": "Set number",
    "使用": "Use",
    "納品": "Receive",
    "仕入れを追加": "Add purchase",
    "使用分を減らす": "Use stock",
    "設定": "Settings",
    "発注設定なし": "No order settings",
    "連絡先": "Contact",
    "方法": "Method",
    "締切": "Cutoff",
    "納品": "Delivery",
    "注意": "Note",
    "推奨": "Suggested"
  },
  es: {
    "言語": "Idioma",
    "日本語": "Japonés",
    "ログイン": "Iniciar sesión",
    "ログアウト": "Cerrar sesión",
    "メール": "Email",
    "電話": "Teléfono",
    "その他": "Otro",
    "閉じる": "Cerrar",
    "未接続": "Sin conexión",
    "未ログイン": "Sin iniciar sesión",
    "Supabase未設定": "Supabase no configurado",
    "店舗": "Tienda",
    "店舗設定": "Ajustes de tienda",
    "最新データを取得": "Actualizar datos",
    "CSV出力": "Exportar CSV",
    "CSV取込": "Importar CSV",
    "食材・資材を追加": "Agregar producto",
    "食材・資材を編集": "Editar producto",
    "在庫管理": "Inventario",
    "冷蔵庫チェック": "Revisión de frío",
    "発注": "Pedidos",
    "原価計算": "Costos",
    "登録品目": "Productos",
    "総在庫量": "Stock total",
    "低在庫": "Stock bajo",
    "在庫金額": "Valor de inventario",
    "絞り込み": "Filtros",
    "解除": "Limpiar",
    "検索": "Buscar",
    "カテゴリ": "Categoría",
    "カテゴリー": "Categoría",
    "業者": "Proveedor",
    "業者追加": "Agregar proveedor",
    "業者削除": "Eliminar proveedor",
    "表示": "Vista",
    "店舗在庫一覧": "Lista de inventario",
    "商品名": "Producto",
    "分類": "Categoría",
    "在庫量": "Stock",
    "現在庫": "Stock actual",
    "適正在庫": "Stock ideal",
    "適正在庫 平日": "Stock ideal entre semana",
    "適正在庫 土日": "Stock ideal fin de semana",
    "発注点": "Punto de pedido",
    "単価": "Precio unitario",
    "g単価": "Precio/g",
    "操作": "Acciones",
    "チェック場所": "Lugar de revisión",
    "保管場所": "Ubicación",
    "この場所のURLをコピー": "Copiar URL de este lugar",
    "チェック対象がありません": "No hay productos para revisar",
    "商品編集で「保管場所」を入れると、この画面に表示されます。": "Los productos aparecen aquí al definir su ubicación.",
    "発注条件": "Condiciones de pedido",
    "平日": "Entre semana",
    "土日": "Fin de semana",
    "発注文をコピー": "Copiar pedido",
    "業者設定": "Ajustes de proveedor",
    "メール下書き": "Borrador de email",
    "発注CSV": "CSV de pedido",
    "発注済みにする": "Marcar pedido",
    "業者別 発注候補": "Sugerencias por proveedor",
    "発注候補がありません": "No hay sugerencias de pedido",
    "発注点を下回った商品がここに表示されます。": "Aquí aparecen productos bajo el punto de pedido.",
    "メニュー": "Menú",
    "原価率": "Porcentaje de costo",
    "メニュー原価を追加": "Agregar costo de menú",
    "メニュー原価を編集": "Editar costo de menú",
    "原価一覧CSV": "CSV de costos",
    "メニュー原価": "Costos de menú",
    "メニュー原価がありません": "No hay costos de menú",
    "「メニュー原価を追加」から、料理やドリンクごとの材料を登録してください。": "Agrega ingredientes de platos y bebidas desde Agregar costo de menú.",
    "個別商品名": "Nombre del producto",
    "管理番号": "Código",
    "業者名": "Proveedor",
    "単位": "Unidad",
    "メモ": "Nota",
    "キャンセル": "Cancelar",
    "保存": "Guardar",
    "在庫を更新": "Actualizar stock",
    "数量": "Cantidad",
    "内容": "Detalle",
    "反映": "Aplicar",
    "管理者設定": "Ajustes de admin",
    "店舗名": "Nombre de tienda",
    "画面名": "Nombre de pantalla",
    "会社・ブランド名": "Empresa / Marca",
    "管理者メール": "Email de admin",
    "ロゴ画像URL（任意）": "URL del logo (opcional)",
    "カテゴリ（1行に1つ）": "Categorías (una por línea)",
    "保管場所（1行に1つ）": "Ubicaciones (una por línea)",
    "単位（1行に1つ）": "Unidades (una por línea)",
    "この設定は現在選択している店舗だけに反映されます。": "Estos ajustes solo aplican a la tienda seleccionada.",
    "QR印刷": "Imprimir QR",
    "業者発注設定": "Ajustes de pedido",
    "発注方法": "Método de pedido",
    "連絡先": "Contacto",
    "締切時間": "Hora límite",
    "納品曜日": "Días de entrega",
    "最小発注・注意": "Mínimo / Notas",
    "発注メモ": "Nota del pedido",
    "設定削除": "Eliminar ajustes",
    "メニュー名": "Nombre del menú",
    "販売価格": "Precio de venta",
    "仕込み単位 / 仕上がり量g": "Tamaño de lote / gramos",
    "使用材料": "Ingredientes",
    "材料を追加": "Agregar ingrediente",
    "1食/g単価": "Por porción / precio g",
    "1食原価": "Costo por porción",
    "仕上がり量": "Cantidad final",
    "総原価": "Costo total",
    "在庫反映": "Reflejo en inventario",
    "粗利": "Ganancia bruta",
    "材料が登録されていません。": "No hay ingredientes registrados.",
    "材料名未設定": "Ingrediente sin nombre",
    "原価": "Costo",
    "指定順": "Orden manual",
    "商品名順": "Por producto",
    "在庫が少ない順": "Menor stock primero",
    "在庫が多い順": "Mayor stock primero",
    "在庫金額が高い順": "Mayor valor primero",
    "メニュー名順": "Por menú",
    "原価が高い順": "Mayor costo primero",
    "原価率が高い順": "Mayor porcentaje primero",
    "すべて": "Todo",
    "低在庫のみ": "Solo stock bajo",
    "在庫切れのみ": "Sin stock",
    "35%以上": "35% o más",
    "販売価格未設定": "Sin precio de venta",
    "未設定": "Sin definir",
    "上へ": "Arriba",
    "下へ": "Abajo",
    "数を入力": "Ingresar número",
    "使用": "Usar",
    "納品": "Recibir",
    "仕入れを追加": "Agregar compra",
    "使用分を減らす": "Reducir stock",
    "設定": "Ajustes",
    "発注設定なし": "Sin ajustes de pedido",
    "連絡先": "Contacto",
    "方法": "Método",
    "締切": "Límite",
    "納品": "Entrega",
    "注意": "Nota",
    "推奨": "Sugerido"
  }
};

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

const costingGramPriceYen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const quantityFormat = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 2
});

const textNodeOriginals = new WeakMap();
const reverseUiText = Object.fromEntries(
  Object.entries(uiText).flatMap(([, translations]) =>
    Object.entries(translations).map(([ja, translated]) => [translated, ja])
  )
);

const uiPlaceholders = {
  en: {
    "メール": "Email",
    "パスワード": "Password",
    "商品名・業者・保管場所": "Item, supplier, location",
    "商品名・メモ": "Item or memo",
    "商品名・業者・メモ": "Item, supplier, memo",
    "メニュー名・メモ": "Menu or memo",
    "例: トマト、牛肩ロース、割り箸": "Ex: Tomato, beef shoulder, chopsticks",
    "例: VEG-TOMATO": "Ex: VEG-TOMATO",
    "野菜は業者別管理に使用": "Used to manage vegetables by supplier",
    "例: 冷蔵庫１、冷凍庫３": "Ex: Fridge 1, Freezer 3",
    "例: 個、玉、pac": "Ex: pcs, head, pack",
    "例: 1.14": "Ex: 1.14",
    "例: 1.1433": "Ex: 1.1433",
    "例: 田中青果から仕入れ、ランチで使用": "Ex: Purchased from supplier, used at lunch",
    "例: ○○食堂 渋谷店": "Ex: THE PORT",
    "例: 在庫管理": "Ex: Inventory",
    "例: ○○フードサービス": "Ex: THE PORT",
    "例: manager@example.com": "Ex: manager@example.com",
    "例: タカナシ": "Ex: Takanashi",
    "メール、電話番号、URLなど": "Email, phone number, URL, etc.",
    "例: 前日15時、当日10時": "Ex: Previous day 15:00",
    "例: 月水金、翌日納品": "Ex: Mon/Wed/Fri, next-day delivery",
    "例: ケース単位、前日発注のみ": "Ex: Case orders only",
    "発注文に表示したい注意事項": "Notes to show in order text",
    "例: ハンバーガー、サルサソース": "Ex: Burger, salsa sauce",
    "仕込み品は空欄でOK": "Leave blank for prep items",
    "例: ランチメニュー、季節限定": "Ex: Lunch menu, seasonal"
  },
  es: {
    "メール": "Email",
    "パスワード": "Contraseña",
    "商品名・業者・保管場所": "Producto, proveedor, ubicación",
    "商品名・メモ": "Producto o nota",
    "商品名・業者・メモ": "Producto, proveedor, nota",
    "メニュー名・メモ": "Menú o nota",
    "例: トマト、牛肩ロース、割り箸": "Ej: Tomate, carne, palillos",
    "例: VEG-TOMATO": "Ej: VEG-TOMATO",
    "野菜は業者別管理に使用": "Para gestionar verduras por proveedor",
    "例: 冷蔵庫１、冷凍庫３": "Ej: Refrigerador 1, Congelador 3",
    "例: 個、玉、pac": "Ej: unidad, pieza, pack",
    "例: 1.14": "Ej: 1.14",
    "例: 1.1433": "Ej: 1.1433",
    "例: 田中青果から仕入れ、ランチで使用": "Ej: Compra a proveedor, uso en almuerzo",
    "例: ○○食堂 渋谷店": "Ej: THE PORT",
    "例: 在庫管理": "Ej: Inventario",
    "例: ○○フードサービス": "Ej: THE PORT",
    "例: manager@example.com": "Ej: manager@example.com",
    "例: タカナシ": "Ej: Takanashi",
    "メール、電話番号、URLなど": "Email, teléfono, URL, etc.",
    "例: 前日15時、当日10時": "Ej: Día anterior 15:00",
    "例: 月水金、翌日納品": "Ej: Lun/Mié/Vie, entrega al día siguiente",
    "例: ケース単位、前日発注のみ": "Ej: Solo por caja",
    "発注文に表示したい注意事項": "Notas para mostrar en el pedido",
    "例: ハンバーガー、サルサソース": "Ej: Hamburguesa, salsa",
    "仕込み品は空欄でOK": "Puede quedar vacío para preparación",
    "例: ランチメニュー、季節限定": "Ej: Menú de almuerzo, temporada"
  }
};

function t(text) {
  return uiText[currentLanguage]?.[text] ?? text;
}

function preserveSpacing(source, translated) {
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function translateTextNode(node) {
  const raw = node.textContent;
  const key = textNodeOriginals.get(node) ?? reverseUiText[raw.trim()] ?? raw.trim();
  if (!key) return;
  const translated = currentLanguage === "ja" ? key : t(key);
  if (translated !== key || uiText.en[key] || uiText.es[key]) {
    textNodeOriginals.set(node, key);
    node.textContent = preserveSpacing(raw, translated);
  }
}

function translateElementText(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(translateTextNode);
}

function translatePlaceholders(root = document) {
  root.querySelectorAll("[placeholder]").forEach((element) => {
    const original = element.dataset.placeholderJa ?? reverseUiText[element.placeholder] ?? element.placeholder;
    element.dataset.placeholderJa = original;
    element.placeholder = currentLanguage === "ja" ? original : (uiPlaceholders[currentLanguage]?.[original] ?? original);
  });
}

function applyLanguage(root = document.body) {
  document.documentElement.lang = currentLanguage;
  if (els.languageSelect) els.languageSelect.value = currentLanguage;
  translateElementText(root);
  translatePlaceholders(root instanceof Document ? root : document);
  updateAppTitle();
}

function changeLanguage(language) {
  currentLanguage = ["ja", "en", "es"].includes(language) ? language : "ja";
  localStorage.setItem(LANGUAGE_KEY, currentLanguage);
  render();
}

const els = {
  appTitle: document.querySelector("#appTitle"),
  brandEyebrow: document.querySelector("#brandEyebrow"),
  brandLogo: document.querySelector("#brandLogo"),
  languageSelect: document.querySelector("#languageSelect"),
  storeControl: document.querySelector("#storeControl"),
  storeSelector: document.querySelector("#storeSelector"),
  openStoreSettings: document.querySelector("#openStoreSettings"),
  costingAreaTitle: document.querySelector("#costingAreaTitle"),
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
  orderSupplierFilter: document.querySelector("#orderSupplierFilter"),
  orderSearchInput: document.querySelector("#orderSearchInput"),
  orderStockMode: document.querySelector("#orderStockMode"),
  clearOrderFilters: document.querySelector("#clearOrderFilters"),
  copyOrderText: document.querySelector("#copyOrderText"),
  openSupplierOrderSettings: document.querySelector("#openSupplierOrderSettings"),
  openSupplierOrderSettingsTop: document.querySelector("#openSupplierOrderSettingsTop"),
  openOrderMail: document.querySelector("#openOrderMail"),
  exportOrderCsv: document.querySelector("#exportOrderCsv"),
  markOrderDone: document.querySelector("#markOrderDone"),
  orderResultCount: document.querySelector("#orderResultCount"),
  orderList: document.querySelector("#orderList"),
  orderEmptyState: document.querySelector("#orderEmptyState"),
  orderTextPreview: document.querySelector("#orderTextPreview"),
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
  cancelCostingForm: document.querySelector("#cancelCostingForm"),
  supplierOrderDialog: document.querySelector("#supplierOrderDialog"),
  supplierOrderForm: document.querySelector("#supplierOrderForm"),
  supplierOrderName: document.querySelector("#supplierOrderName"),
  supplierOrderMethod: document.querySelector("#supplierOrderMethod"),
  supplierOrderContact: document.querySelector("#supplierOrderContact"),
  supplierOrderCutoff: document.querySelector("#supplierOrderCutoff"),
  supplierOrderDeliveryDays: document.querySelector("#supplierOrderDeliveryDays"),
  supplierOrderMinimum: document.querySelector("#supplierOrderMinimum"),
  supplierOrderMemo: document.querySelector("#supplierOrderMemo"),
  cancelSupplierOrderSettings: document.querySelector("#cancelSupplierOrderSettings"),
  deleteSupplierOrderSettings: document.querySelector("#deleteSupplierOrderSettings"),
  storeSettingsDialog: document.querySelector("#storeSettingsDialog"),
  storeSettingsForm: document.querySelector("#storeSettingsForm"),
  settingsStoreName: document.querySelector("#settingsStoreName"),
  settingsAppName: document.querySelector("#settingsAppName"),
  settingsBusinessName: document.querySelector("#settingsBusinessName"),
  settingsManagerEmail: document.querySelector("#settingsManagerEmail"),
  settingsLogoUrl: document.querySelector("#settingsLogoUrl"),
  settingsCategories: document.querySelector("#settingsCategories"),
  settingsLocations: document.querySelector("#settingsLocations"),
  settingsUnits: document.querySelector("#settingsUnits"),
  cancelStoreSettings: document.querySelector("#cancelStoreSettings"),
  openQrCodes: document.querySelector("#openQrCodes")
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
  els.authStatus.textContent = text.includes("@") ? text : t(text);
}

function scopedStorageKey(baseKey) {
  return currentStore?.id ? `${baseKey}:${currentStore.id}` : baseKey;
}

function scopeToCurrentStore(query) {
  if (tenancyEnabled && currentStore?.id) return query.eq("store_id", currentStore.id);
  return query;
}

function cleanSettingsList(value, fallback) {
  const entries = Array.isArray(value) ? value : [];
  const cleaned = [...new Set(entries.map((entry) => String(entry ?? "").trim()).filter(Boolean))];
  return cleaned.length ? cleaned : [...fallback];
}

function settingsFromDb(row) {
  return {
    appName: row?.app_name || defaultStoreSettings.appName,
    businessName: row?.business_name || currentStore?.name || defaultStoreSettings.businessName,
    logoUrl: row?.logo_url || "",
    managerEmail: row?.manager_email || "",
    categories: cleanSettingsList(row?.categories, defaultCategoryOptions),
    storageLocations: cleanSettingsList(row?.storage_locations, defaultStorageLocationOptions),
    units: cleanSettingsList(row?.units, defaultUnitOptions)
  };
}

function applyStoreSettings(settings = defaultStoreSettings) {
  storeSettings = {
    ...defaultStoreSettings,
    ...settings,
    categories: cleanSettingsList(settings.categories, defaultCategoryOptions),
    storageLocations: cleanSettingsList(settings.storageLocations, defaultStorageLocationOptions),
    units: cleanSettingsList(settings.units, defaultUnitOptions)
  };
  categoryOptions = [...storeSettings.categories];
  storageLocationOptions = [...storeSettings.storageLocations];
  unitOptions = [...storeSettings.units];
  els.brandEyebrow.textContent = storeSettings.businessName;
  els.brandLogo.hidden = !storeSettings.logoUrl;
  if (storeSettings.logoUrl) els.brandLogo.src = storeSettings.logoUrl;
  updateAppTitle();
  renderStoreControls();
}

function renderStoreControls() {
  const showControl = Boolean(currentUser && tenancyEnabled && currentStore);
  els.storeControl.hidden = !showControl;
  els.openStoreSettings.hidden = !showControl || currentStoreRole !== "admin";
  els.addSupplier.hidden = showControl && currentStoreRole !== "admin";
  els.deleteSupplier.hidden = showControl && currentStoreRole !== "admin";
  els.openSupplierOrderSettings.hidden = showControl && currentStoreRole !== "admin";
  els.openSupplierOrderSettingsTop.hidden = showControl && currentStoreRole !== "admin";
  if (!showControl) return;

  els.storeSelector.innerHTML = "";
  availableStores.forEach((store) => {
    const option = document.createElement("option");
    option.value = store.id;
    option.textContent = store.name;
    els.storeSelector.append(option);
  });
  els.storeSelector.value = currentStore.id;
  els.storeSelector.hidden = availableStores.length < 2;
  els.storeControl.querySelector("label").hidden = availableStores.length < 2;
}

async function loadTenantContext() {
  if (!supabaseClient || !currentUser) {
    tenancyEnabled = false;
    availableStores = [];
    currentStore = null;
    currentStoreRole = "staff";
    applyStoreSettings(defaultStoreSettings);
    return;
  }

  const { data: memberships, error: membershipError } = await supabaseClient
    .from("store_members")
    .select("store_id, role")
    .eq("user_id", currentUser.id);

  if (membershipError?.code === "42P01" || membershipError?.code === "PGRST205") {
    tenancyEnabled = false;
    availableStores = [];
    currentStore = null;
    currentStoreRole = "admin";
    applyStoreSettings({
      ...defaultStoreSettings,
      businessName: "THE PORT",
      managerEmail: "okuda@anothertable.co.jp"
    });
    return;
  }
  if (membershipError) throw membershipError;

  tenancyEnabled = true;
  if (!memberships?.length) {
    availableStores = [];
    currentStore = null;
    applyStoreSettings(defaultStoreSettings);
    alert("このユーザーに利用店舗が割り当てられていません。管理者へ連絡してください。");
    return;
  }

  const roleByStore = new Map(memberships.map((membership) => [membership.store_id, membership.role]));
  const { data: stores, error: storesError } = await supabaseClient
    .from("stores")
    .select("id, name, organization_id")
    .in("id", memberships.map((membership) => membership.store_id))
    .order("name", { ascending: true });
  if (storesError) throw storesError;

  availableStores = stores ?? [];
  const params = new URLSearchParams(window.location.search);
  const requestedStoreId = params.get("store") || localStorage.getItem(SELECTED_STORE_KEY);
  currentStore = availableStores.find((store) => store.id === requestedStoreId) ?? availableStores[0];
  currentStoreRole = roleByStore.get(currentStore.id) ?? "staff";
  localStorage.setItem(SELECTED_STORE_KEY, currentStore.id);

  const { data: settingsRow, error: settingsError } = await supabaseClient
    .from("store_settings")
    .select("*")
    .eq("store_id", currentStore.id)
    .maybeSingle();
  if (settingsError) throw settingsError;
  applyStoreSettings(settingsFromDb(settingsRow));
}

function updateAppTitle(view = document.querySelector(".tab-button.active")?.dataset.view || "inventory") {
  const base = storeSettings.businessName || currentStore?.name || t("店舗");
  const labels = {
    inventory: storeSettings.appName === defaultStoreSettings.appName || !storeSettings.appName ? t("在庫管理") : storeSettings.appName,
    check: t("冷蔵庫チェック"),
    order: t("発注"),
    costing: t("原価計算")
  };
  const title = `${base} ${labels[view]}`.trim();
  els.appTitle.textContent = title;
  document.title = title;
  els.costingAreaTitle.textContent = `${base} ${t("原価")}`;
}

function parseSettingsLines(value) {
  return [...new Set(String(value ?? "").split(/\r?\n|、/u).map((entry) => entry.trim()).filter(Boolean))];
}

function openStoreSettings() {
  if (!currentStore || currentStoreRole !== "admin") return;
  els.settingsStoreName.value = currentStore.name;
  els.settingsAppName.value = storeSettings.appName;
  els.settingsBusinessName.value = storeSettings.businessName;
  els.settingsManagerEmail.value = storeSettings.managerEmail;
  els.settingsLogoUrl.value = storeSettings.logoUrl;
  els.settingsCategories.value = storeSettings.categories.join("\n");
  els.settingsLocations.value = storeSettings.storageLocations.join("\n");
  els.settingsUnits.value = storeSettings.units.join("\n");
  els.storeSettingsDialog.showModal();
  applyLanguage(els.storeSettingsDialog);
}

function closeStoreSettings() {
  els.storeSettingsDialog.close();
}

function openQrCodes() {
  const url = new URL("qr-codes.html", window.location.href);
  url.searchParams.set("name", storeSettings.businessName);
  url.searchParams.set("locations", storeSettings.storageLocations.join("|"));
  if (currentStore?.id) url.searchParams.set("store", currentStore.id);
  window.open(url.toString(), "_blank", "noopener");
}

async function handleStoreSettingsSubmit(event) {
  event.preventDefault();
  if (!supabaseClient || !currentStore || currentStoreRole !== "admin") return;

  const nextSettings = {
    appName: els.settingsAppName.value.trim(),
    businessName: els.settingsBusinessName.value.trim(),
    managerEmail: els.settingsManagerEmail.value.trim(),
    logoUrl: els.settingsLogoUrl.value.trim(),
    categories: parseSettingsLines(els.settingsCategories.value),
    storageLocations: parseSettingsLines(els.settingsLocations.value),
    units: parseSettingsLines(els.settingsUnits.value)
  };
  if (!nextSettings.categories.length || !nextSettings.storageLocations.length || !nextSettings.units.length) {
    alert("カテゴリ・保管場所・単位は、それぞれ1つ以上入力してください。");
    return;
  }

  const { error: storeError } = await supabaseClient
    .from("stores")
    .update({ name: els.settingsStoreName.value.trim() })
    .eq("id", currentStore.id);
  if (storeError) {
    alert(`店舗名を保存できませんでした: ${storeError.message}`);
    return;
  }

  const { error: settingsError } = await supabaseClient
    .from("store_settings")
    .update({
      app_name: nextSettings.appName,
      business_name: nextSettings.businessName,
      manager_email: nextSettings.managerEmail || null,
      logo_url: nextSettings.logoUrl || null,
      categories: nextSettings.categories,
      storage_locations: nextSettings.storageLocations,
      units: nextSettings.units
    })
    .eq("store_id", currentStore.id);
  if (settingsError) {
    alert(`店舗設定を保存できませんでした: ${settingsError.message}`);
    return;
  }

  currentStore = { ...currentStore, name: els.settingsStoreName.value.trim() };
  availableStores = availableStores.map((store) => store.id === currentStore.id ? currentStore : store);
  applyStoreSettings(nextSettings);
  closeStoreSettings();
  render();
}

async function switchStore(storeId) {
  if (!availableStores.some((store) => store.id === storeId)) return;
  localStorage.setItem(SELECTED_STORE_KEY, storeId);
  const url = new URL(window.location.href);
  url.searchParams.set("store", storeId);
  window.history.replaceState(null, "", url);
  await init();
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
  if (els.dialog.open || els.movementDialog.open || els.costingDialog.open || els.supplierOrderDialog.open || els.storeSettingsDialog.open) return;
  if (saveInProgress > 0 || Date.now() < suppressAutoRefreshUntil) return;
  await loadTenantContext();
  items = await loadItems();
  history = await loadHistory();
  costings = await loadCostings();
  supplierOrderSettings = await loadSupplierOrderSettings();
  render();
}

function holdAutoRefresh() {
  suppressAutoRefreshUntil = Date.now() + 10000;
}

function beginSave() {
  saveInProgress += 1;
  holdAutoRefresh();
}

function endSave() {
  saveInProgress = Math.max(0, saveInProgress - 1);
  holdAutoRefresh();
}

async function loadItems() {
  if (supabaseClient && !currentUser) return [];

  if (supabaseClient && currentUser) {
    const query = supabaseClient
      .from("inventory_items")
      .select("*")
      .order("name", { ascending: true });
    const { data, error } = await scopeToCurrentStore(query);

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
    const saved = localStorage.getItem(scopedStorageKey(STORAGE_KEY));
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
    const query = supabaseClient
      .from("inventory_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const { data, error } = await scopeToCurrentStore(query);

    if (error) return [];
    return data.map(fromDbMovement);
  }

  try {
    return [];
  } catch {
    const saved = localStorage.getItem(scopedStorageKey(HISTORY_KEY));
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
    category: String(item.category ?? "").trim() || categoryOptions[0] || "未分類",
    supplier: item.supplier ?? "",
    location: normalizeLocation(item.location),
    unit: normalizeUnit(item.unit),
    stock: Number(item.stock) || 0,
    idealWeekdayStock: Number(item.idealWeekdayStock) || 0,
    idealWeekendStock: Number(item.idealWeekendStock) || 0,
    reorderPoint: Number(item.reorderPoint) || 0,
    unitPrice: roundToTwoDecimals(item.unitPrice),
    gramPrice: roundToFourDecimals(item.gramPrice) || inferGramPriceFromNote(item.note),
    checkSortOrder: Number.isFinite(Number(item.checkSortOrder)) ? Number(item.checkSortOrder) : null,
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
    const query = supabaseClient
      .from("menu_costings")
      .select("*")
      .order("name", { ascending: true });
    const { data, error } = await scopeToCurrentStore(query);

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
    localStorage.setItem(scopedStorageKey(COSTINGS_KEY), JSON.stringify(cloudCostings));
    return cloudCostings;
  }

  return localCostings;
}

async function loadSupplierOrderSettings() {
  const localSettings = readLocalSupplierOrderSettings();

  if (supabaseClient && !currentUser) return [];

  if (supabaseClient && currentUser) {
    const query = supabaseClient
      .from("supplier_order_settings")
      .select("*")
      .order("supplier", { ascending: true });
    const { data, error } = await scopeToCurrentStore(query);

    if (error?.code === "42P01" || error?.code === "PGRST205") return localSettings;
    if (error) {
      console.warn(`業者発注設定の読み込みに失敗しました: ${error.message}`);
      return localSettings;
    }

    if (data.length === 0 && localSettings.length > 0) {
      supplierOrderSettings = localSettings;
      await saveSupplierOrderSettings();
      return localSettings;
    }

    const cloudSettings = data.map(fromDbSupplierOrderSetting).map(normalizeSupplierOrderSetting);
    localStorage.setItem(scopedStorageKey(SUPPLIER_ORDER_SETTINGS_KEY), JSON.stringify(cloudSettings));
    return cloudSettings;
  }

  return localSettings;
}

function readLocalSupplierOrderSettings() {
  try {
    return JSON.parse(localStorage.getItem(scopedStorageKey(SUPPLIER_ORDER_SETTINGS_KEY)) || "[]").map(normalizeSupplierOrderSetting);
  } catch {
    return [];
  }
}

function readLocalCostings() {
  try {
    return normalizeCostingsList(JSON.parse(localStorage.getItem(scopedStorageKey(COSTINGS_KEY)) || "[]"));
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

function normalizeSupplierOrderSetting(setting) {
  const supplier = String(setting.supplier ?? "").trim();
  return {
    supplier,
    method: setting.method || "LINE",
    contact: setting.contact ?? "",
    cutoff: setting.cutoff ?? "",
    deliveryDays: setting.deliveryDays ?? "",
    minimumOrder: setting.minimumOrder ?? "",
    memo: setting.memo ?? ""
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
  beginSave();
  try {
    if (supabaseClient && currentUser) {
      const { error } = await supabaseClient
        .from("inventory_items")
        .upsert(items.map(toDbItem), { onConflict: "id" });

      if (error?.code === "PGRST204" || error?.code === "42703") {
        const { error: retryError } = await supabaseClient
          .from("inventory_items")
          .upsert(items.map((item) => toDbItem(item, false)), { onConflict: "id" });

        if (retryError) {
          alert(`在庫データの保存に失敗しました: ${retryError.message}`);
          return false;
        }
        localStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(items));
        return true;
      }

      if (error) {
        alert(`在庫データの保存に失敗しました: ${error.message}`);
        return false;
      }
    }

    localStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(items));
    return true;
  } finally {
    endSave();
  }
}

async function saveHistory() {
  const recentHistory = history.slice(0, 100);
  beginSave();
  try {
    if (supabaseClient && currentUser && recentHistory[0]) {
      const { error } = await supabaseClient
        .from("inventory_movements")
        .insert(toDbMovement(recentHistory[0]));

      if (error) console.warn(`履歴保存に失敗しました: ${error.message}`);
    }

    localStorage.setItem(scopedStorageKey(HISTORY_KEY), JSON.stringify(recentHistory));
    return true;
  } finally {
    endSave();
  }
}

async function saveCostings() {
  beginSave();
  try {
    if (supabaseClient && currentUser && costings.length > 0) {
      const { error } = await supabaseClient
        .from("menu_costings")
        .upsert(costings.map(toDbCosting), { onConflict: "id" });

      if (error?.code === "PGRST204" || error?.code === "42703") {
        const { error: retryError } = await supabaseClient
          .from("menu_costings")
          .upsert(costings.map((costing) => toDbCosting(costing, false)), { onConflict: "id" });

        if (retryError) {
          alert(`原価計算データの保存に失敗しました: ${retryError.message}`);
          return false;
        }
        localStorage.setItem(scopedStorageKey(COSTINGS_KEY), JSON.stringify(costings));
        return true;
      }

      if (error) {
        alert(`原価計算データの保存に失敗しました: ${error.message}`);
        return false;
      }
    }

    localStorage.setItem(scopedStorageKey(COSTINGS_KEY), JSON.stringify(costings));
    return true;
  } finally {
    endSave();
  }
}

async function saveSupplierOrderSettings() {
  const normalizedSettings = supplierOrderSettings
    .map(normalizeSupplierOrderSetting)
    .filter((setting) => setting.supplier);
  supplierOrderSettings = normalizedSettings;
  beginSave();
  try {
    if (supabaseClient && currentUser && normalizedSettings.length > 0) {
      const { error } = await supabaseClient
        .from("supplier_order_settings")
        .upsert(normalizedSettings.map(toDbSupplierOrderSetting), { onConflict: tenancyEnabled ? "store_id,supplier" : "supplier" });

      if (error?.code === "42P01" || error?.code === "PGRST205") {
        alert("業者発注設定を全端末で共有するには、Supabaseで supplier_order_settings テーブル作成SQLを実行してください。");
        return false;
      }
      if (error) {
        alert(`業者発注設定の保存に失敗しました: ${error.message}`);
        return false;
      }
    }

    localStorage.setItem(scopedStorageKey(SUPPLIER_ORDER_SETTINGS_KEY), JSON.stringify(normalizedSettings));
    return true;
  } finally {
    endSave();
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
    checkSortOrder: row.check_sort_order,
    note: row.note
  };
}

function toDbItem(item, includeOptionalColumns = true) {
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
  if (includeOptionalColumns) {
    row.gram_price = Number(normalized.gramPrice) || 0;
    row.check_sort_order = normalized.checkSortOrder;
  }
  if (tenancyEnabled && currentStore?.id) row.store_id = currentStore.id;
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
  const row = {
    item_id: entry.itemId,
    item_name: entry.itemName,
    movement_type: entry.type,
    quantity: entry.quantity,
    unit: entry.unit,
    memo: entry.memo,
    user_email: currentUser?.email ?? ""
  };
  if (tenancyEnabled && currentStore?.id) row.store_id = currentStore.id;
  return row;
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
  if (tenancyEnabled && currentStore?.id) row.store_id = currentStore.id;
  return row;
}

function fromDbSupplierOrderSetting(row) {
  return {
    supplier: row.supplier,
    method: row.method,
    contact: row.contact,
    cutoff: row.cutoff,
    deliveryDays: row.delivery_days,
    minimumOrder: row.minimum_order,
    memo: row.memo
  };
}

function toDbSupplierOrderSetting(setting) {
  const normalized = normalizeSupplierOrderSetting(setting);
  const row = {
    supplier: normalized.supplier,
    method: normalized.method,
    contact: normalized.contact,
    cutoff: normalized.cutoff,
    delivery_days: normalized.deliveryDays,
    minimum_order: normalized.minimumOrder,
    memo: normalized.memo
  };
  if (tenancyEnabled && currentStore?.id) row.store_id = currentStore.id;
  return row;
}

function render() {
  renderItemFormOptions();
  renderSummary();
  renderCategoryFilter();
  renderSupplierFilter();
  renderLocationOptions();
  renderTable(getVisibleItems());
  renderCheckLocations();
  renderCheckItems();
  renderOrderSuppliers();
  renderOrders();
  renderCostings();
  applyLanguage();
}

function formatVisibleCount(count) {
  if (currentLanguage === "en") return `${count} shown`;
  if (currentLanguage === "es") return `${count} mostrados`;
  return `${count}件を表示中`;
}

function renderItemFormOptions() {
  const categorySelect = document.querySelector("#category");
  const selectedCategory = categorySelect.value;
  categorySelect.innerHTML = "";
  categoryOptions.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  });
  categorySelect.value = categoryOptions.includes(selectedCategory) ? selectedCategory : categoryOptions[0] || "";

  const unitList = document.querySelector("#unitOptions");
  unitList.innerHTML = unitOptions.map((unit) => `<option value="${escapeHtml(unit)}"></option>`).join("");
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
    return JSON.parse(localStorage.getItem(scopedStorageKey(SUPPLIER_KEY)) || "[]");
  } catch {
    return [];
  }
}

function saveSupplierOptions(suppliers) {
  localStorage.setItem(scopedStorageKey(SUPPLIER_KEY), JSON.stringify([...new Set(suppliers.filter(Boolean))]));
}

function addSupplier() {
  const supplier = window.prompt("追加する業者名を入力してください。")?.trim();
  if (!supplier) return;

  saveSupplierOptions([...loadSavedSuppliers(), supplier]);
  render();
  els.supplierFilter.value = supplier;
  renderTable(getVisibleItems());
}

async function deleteSupplier() {
  const current = els.supplierFilter.value;
  const supplier = (current || window.prompt("削除する業者名を入力してください。"))?.trim();
  if (!supplier) return;

  const affectedCount = items.filter((item) => item.supplier === supplier).length;
  const message = affectedCount > 0
    ? `${supplier} が設定されている商品 ${affectedCount}件の業者名を未設定にします。よろしいですか？`
    : `${supplier} を業者候補から削除します。よろしいですか？`;
  if (!window.confirm(message)) return;

  const previousItems = [...items];
  items = items.map((item) => (item.supplier === supplier ? { ...item, supplier: "" } : item));
  saveSupplierOptions(loadSavedSuppliers().filter((entry) => entry !== supplier));
  els.supplierFilter.value = "";
  const saved = await saveItems();
  if (!saved) {
    items = previousItems;
    render();
    return;
  }
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
      const orderA = Number.isFinite(Number(a.checkSortOrder)) ? Number(a.checkSortOrder) : Number.MAX_SAFE_INTEGER;
      const orderB = Number.isFinite(Number(b.checkSortOrder)) ? Number(b.checkSortOrder) : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, "ja");
    });
}

function renderCheckItems() {
  const visibleItems = getCheckItems();
  const location = els.checkLocationFilter.value;
  els.checkGrid.innerHTML = "";
  const checkSuffix = currentLanguage === "en" ? "check" : currentLanguage === "es" ? "revisión" : "チェック";
  els.checkLocationTitle.textContent = location ? `${location} ${checkSuffix}` : t("冷蔵庫チェック");
  els.checkResultCount.textContent = formatVisibleCount(visibleItems.length);
  els.checkEmptyState.hidden = visibleItems.length !== 0;

  visibleItems.forEach((item) => {
    const article = document.createElement("article");
    article.className = "check-card";
    article.innerHTML = `
      <div class="check-card-main">
        <button class="check-name-button" data-check-action="edit" data-id="${item.id}" type="button">
          ${escapeHtml(item.name)}
        </button>
        <span>${escapeHtml(item.location || t("未設定"))} / ${escapeHtml(item.category)}</span>
      </div>
      <div class="check-stock">
        <button class="check-step-button decrease" data-check-action="decrease" data-id="${item.id}" type="button">-1</button>
        <strong>${formatQuantity(item.stock)}<small>${escapeHtml(item.unit)}</small></strong>
        <button class="check-step-button increase" data-check-action="increase" data-id="${item.id}" type="button">+1</button>
      </div>
      <div class="check-card-actions">
        <button class="ghost-button" data-check-action="move-up" data-id="${item.id}" type="button">${t("上へ")}</button>
        <button class="ghost-button" data-check-action="move-down" data-id="${item.id}" type="button">${t("下へ")}</button>
        <button class="ghost-button" data-check-action="set" data-id="${item.id}" type="button">${t("数を入力")}</button>
        <button class="ghost-button" data-check-action="use" data-id="${item.id}" type="button">${t("使用")}</button>
        <button class="ghost-button" data-check-action="receive" data-id="${item.id}" type="button">${t("納品")}</button>
      </div>
    `;
    els.checkGrid.append(article);
  });
}

function renderOrderSuppliers() {
  const current = els.orderSupplierFilter.value;
  const suppliers = getSupplierOptions();
  els.orderSupplierFilter.innerHTML = '<option value="">すべて</option>';
  suppliers.forEach((supplier) => {
    const option = document.createElement("option");
    option.value = supplier;
    option.textContent = supplier;
    els.orderSupplierFilter.append(option);
  });
  els.orderSupplierFilter.value = suppliers.includes(current) ? current : "";
}

function getSuggestedOrderQuantity(item) {
  const stock = Number(item.stock) || 0;
  const reorderPoint = Number(item.reorderPoint) || 0;
  const ideal = els.orderStockMode.value === "weekend"
    ? Number(item.idealWeekendStock) || 0
    : Number(item.idealWeekdayStock) || 0;
  const idealGap = ideal > 0 ? ideal - stock : 0;
  const reorderGap = reorderPoint > 0 ? reorderPoint - stock : 0;
  return Math.max(1, Math.ceil(Math.max(idealGap, reorderGap)));
}

function getOrderRows() {
  const supplier = els.orderSupplierFilter.value;
  const query = els.orderSearchInput.value.trim().toLowerCase();
  return items
    .filter((item) => {
      const reorderPoint = Number(item.reorderPoint) || 0;
      const stock = Number(item.stock) || 0;
      const isCandidate = reorderPoint > 0 && stock <= reorderPoint;
      const matchesSupplier = !supplier || item.supplier === supplier;
      const haystack = `${item.name} ${item.supplier} ${item.category} ${item.location} ${item.note}`.toLowerCase();
      return isCandidate && matchesSupplier && haystack.includes(query);
    })
    .sort((a, b) => {
      const supplierCompare = (a.supplier || "未設定").localeCompare(b.supplier || "未設定", "ja");
      if (supplierCompare !== 0) return supplierCompare;
      return a.name.localeCompare(b.name, "ja");
    })
    .map((item) => ({
      item,
      suggestedQuantity: getSuggestedOrderQuantity(item),
      orderQuantity: Number(orderQuantities[item.id]) > 0 ? Number(orderQuantities[item.id]) : getSuggestedOrderQuantity(item)
    }));
}

function getSupplierOrderSetting(supplier) {
  return supplierOrderSettings.find((setting) => setting.supplier === supplier) ?? null;
}

function formatSupplierOrderDetails(setting) {
  if (!setting) return t("発注設定なし");
  return [
    setting.method ? `${t("方法")}: ${setting.method}` : "",
    setting.cutoff ? `${t("締切")}: ${setting.cutoff}` : "",
    setting.deliveryDays ? `${t("納品")}: ${setting.deliveryDays}` : "",
    setting.minimumOrder ? `${t("注意")}: ${setting.minimumOrder}` : "",
    setting.contact ? `${t("連絡先")}: ${setting.contact}` : ""
  ].filter(Boolean).join(" / ") || t("発注設定なし");
}

function renderOrders() {
  const rows = getOrderRows();
  els.orderList.innerHTML = "";
  els.orderResultCount.textContent = formatVisibleCount(rows.length);
  els.orderEmptyState.hidden = rows.length !== 0;
  els.orderTextPreview.hidden = rows.length === 0;
  els.orderTextPreview.value = buildOrderText(rows);

  const grouped = new Map();
  rows.forEach((row) => {
    const supplier = row.item.supplier || t("未設定");
    if (!grouped.has(supplier)) grouped.set(supplier, []);
    grouped.get(supplier).push(row);
  });

  grouped.forEach((supplierRows, supplier) => {
    const setting = getSupplierOrderSetting(supplier);
    const section = document.createElement("article");
    section.className = "order-group";
    section.innerHTML = `
      <div class="order-group-header">
        <div>
          <h3>${escapeHtml(supplier)}</h3>
          <p>${formatVisibleCount(supplierRows.length)} / ${escapeHtml(formatSupplierOrderDetails(setting))}</p>
          ${setting?.memo ? `<p>${escapeHtml(setting.memo)}</p>` : ""}
        </div>
        <button class="ghost-button" data-supplier-order-action="edit" data-supplier="${escapeHtml(supplier)}" type="button">${t("設定")}</button>
      </div>
      <div class="table-wrap compact">
        <table>
          <thead>
            <tr>
              <th>商品名</th>
              <th>現在庫</th>
              <th>適正在庫</th>
              <th>発注点</th>
              <th>発注数</th>
              <th>メモ</th>
            </tr>
          </thead>
          <tbody>
            ${supplierRows.map(({ item, suggestedQuantity, orderQuantity }) => `
              <tr>
                <td>
                  <div class="product-main">
                    <strong>${escapeHtml(item.name)}</strong>
                    <span class="sku">${escapeHtml(item.location || t("未設定"))} / ${escapeHtml(item.category)}</span>
                  </div>
                </td>
                <td>${formatQuantity(item.stock)} ${escapeHtml(item.unit)}</td>
                <td>${formatQuantity(els.orderStockMode.value === "weekend" ? item.idealWeekendStock : item.idealWeekdayStock)} ${escapeHtml(item.unit)}</td>
                <td>${formatQuantity(item.reorderPoint)} ${escapeHtml(item.unit)}</td>
                <td>
                  <input class="order-quantity-input" data-order-id="${item.id}" type="number" min="0" step="0.01" value="${escapeHtml(orderQuantity)}" aria-label="${escapeHtml(item.name)}の発注数">
                  <span class="order-unit">${escapeHtml(item.unit)}</span>
                  <small>${t("推奨")} ${formatQuantity(suggestedQuantity)} ${escapeHtml(item.unit)}</small>
                </td>
                <td>${escapeHtml(item.note || "")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
    els.orderList.append(section);
  });
}

function buildOrderText(rows = getOrderRows()) {
  if (rows.length === 0) return "";
  const grouped = new Map();
  rows.forEach((row) => {
    const supplier = row.item.supplier || "未設定";
    if (!grouped.has(supplier)) grouped.set(supplier, []);
    grouped.get(supplier).push(row);
  });

  const date = new Date().toLocaleDateString("ja-JP");
  return [...grouped.entries()].map(([supplier, supplierRows]) => {
    const setting = getSupplierOrderSetting(supplier);
    const detailLines = setting ? [
      setting.method ? `発注方法: ${setting.method}` : "",
      setting.cutoff ? `締切: ${setting.cutoff}` : "",
      setting.deliveryDays ? `納品: ${setting.deliveryDays}` : "",
      setting.minimumOrder ? `注意: ${setting.minimumOrder}` : "",
      setting.memo ? `メモ: ${setting.memo}` : ""
    ].filter(Boolean) : [];
    const lines = supplierRows
      .filter((row) => Number(row.orderQuantity) > 0)
      .map((row) => `${row.item.name}　${formatQuantity(row.orderQuantity)}${row.item.unit}${row.item.note ? `　${row.item.note}` : ""}`);
    return [`【${supplier} 発注】`, date, ...detailLines, ...lines].join("\n");
  }).join("\n\n");
}

async function copyOrderText() {
  const text = buildOrderText();
  if (!text) {
    alert("コピーできる発注候補がありません。");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    alert("発注文をコピーしました。LINEやメールに貼り付けて使えます。");
  } catch {
    window.prompt("この発注文をコピーしてください。", text);
  }
}

function openOrderMail() {
  const text = buildOrderText();
  if (!text) {
    alert("メールにできる発注候補がありません。");
    return;
  }
  const supplier = els.orderSupplierFilter.value || "業者別";
  const setting = els.orderSupplierFilter.value ? getSupplierOrderSetting(els.orderSupplierFilter.value) : null;
  const subject = encodeURIComponent(`${storeSettings.businessName} 発注 ${supplier}`);
  const body = encodeURIComponent(text);
  const contact = setting?.method === "メール" && setting.contact.includes("@") ? setting.contact : "";
  window.location.href = `mailto:${encodeURIComponent(contact)}?subject=${subject}&body=${body}`;
}

function exportOrderCsv() {
  const rows = getOrderRows();
  if (rows.length === 0) {
    alert("出力できる発注候補がありません。");
    return;
  }
  const csvRows = [
    ["業者", "商品名", "現在庫", "適正在庫", "発注点", "発注数", "単位", "保管場所", "メモ"],
    ...rows.map(({ item, orderQuantity }) => [
      item.supplier || "未設定",
      item.name,
      item.stock,
      els.orderStockMode.value === "weekend" ? item.idealWeekendStock : item.idealWeekdayStock,
      item.reorderPoint,
      orderQuantity,
      item.unit,
      item.location,
      item.note
    ])
  ];
  const csv = csvRows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `purchase-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function markOrderDone() {
  const text = buildOrderText();
  if (!text) {
    alert("発注済みにできる候補がありません。");
    return;
  }
  orderQuantities = {};
  els.orderTextPreview.value = text;
  alert("発注内容を確認しました。納品時は在庫管理の「仕入」で在庫を増やしてください。");
  renderOrders();
}

function openSupplierOrderSettings(supplier = "") {
  const selectedSupplier = supplier || els.orderSupplierFilter.value || "";
  const setting = getSupplierOrderSetting(selectedSupplier);
  els.supplierOrderForm.reset();
  els.supplierOrderName.value = selectedSupplier;
  els.supplierOrderMethod.value = setting?.method ?? "LINE";
  els.supplierOrderContact.value = setting?.contact ?? "";
  els.supplierOrderCutoff.value = setting?.cutoff ?? "";
  els.supplierOrderDeliveryDays.value = setting?.deliveryDays ?? "";
  els.supplierOrderMinimum.value = setting?.minimumOrder ?? "";
  els.supplierOrderMemo.value = setting?.memo ?? "";
  els.supplierOrderDialog.showModal();
  applyLanguage(els.supplierOrderDialog);
  els.supplierOrderName.focus();
}

function closeSupplierOrderSettings() {
  els.supplierOrderDialog.close();
}

async function handleSupplierOrderSettingsSubmit(event) {
  event.preventDefault();
  const previousSettings = [...supplierOrderSettings];
  const setting = normalizeSupplierOrderSetting({
    supplier: els.supplierOrderName.value,
    method: els.supplierOrderMethod.value,
    contact: els.supplierOrderContact.value.trim(),
    cutoff: els.supplierOrderCutoff.value.trim(),
    deliveryDays: els.supplierOrderDeliveryDays.value.trim(),
    minimumOrder: els.supplierOrderMinimum.value.trim(),
    memo: els.supplierOrderMemo.value.trim()
  });
  if (!setting.supplier) {
    alert("業者名を入力してください。");
    return;
  }

  supplierOrderSettings = [
    ...supplierOrderSettings.filter((entry) => entry.supplier !== setting.supplier),
    setting
  ].sort((a, b) => a.supplier.localeCompare(b.supplier, "ja"));

  const saved = await saveSupplierOrderSettings();
  if (!saved) {
    supplierOrderSettings = previousSettings;
    renderOrders();
    return;
  }
  closeSupplierOrderSettings();
  renderOrders();
}

async function deleteSupplierOrderSettings() {
  const supplier = els.supplierOrderName.value.trim();
  if (!supplier) return;
  if (!confirm(`${supplier} の発注設定を削除しますか？`)) return;

  supplierOrderSettings = supplierOrderSettings.filter((setting) => setting.supplier !== supplier);
  localStorage.setItem(scopedStorageKey(SUPPLIER_ORDER_SETTINGS_KEY), JSON.stringify(supplierOrderSettings));

  if (supabaseClient && currentUser) {
    let query = supabaseClient
      .from("supplier_order_settings")
      .delete()
      .eq("supplier", supplier);
    query = scopeToCurrentStore(query);
    const { error } = await query;
    if (error && error.code !== "42P01" && error.code !== "PGRST205") {
      alert(`業者発注設定の削除に失敗しました: ${error.message}`);
    }
  }

  closeSupplierOrderSettings();
  renderOrders();
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
  if (!currentUser) return false;
  if (tenancyEnabled) return currentStoreRole === "admin" || currentUser.email === storeSettings.managerEmail;
  return currentUser.email === storeSettings.managerEmail;
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

async function moveCheckItem(id, direction) {
  const visibleItems = getCheckItems();
  const index = visibleItems.findIndex((item) => item.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= visibleItems.length) return;
  const previousItems = [...items];

  const reordered = [...visibleItems];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
  const existingOrders = reordered
    .map((item) => Number(item.checkSortOrder))
    .filter(Number.isFinite);
  const startOrder = existingOrders.length ? Math.min(...existingOrders) : 0;
  const orderById = new Map(reordered.map((item, itemIndex) => [item.id, startOrder + itemIndex]));

  items = items.map((item) => orderById.has(item.id) ? { ...item, checkSortOrder: orderById.get(item.id) } : item);
  const saved = await saveItems();
  if (!saved) {
    items = previousItems;
    renderCheckItems();
    return;
  }
  renderCheckItems();
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
  updateAppTitle(view);
  els.summaryGrid.hidden = view === "check";
}

function renderTable(visibleItems) {
  els.table.innerHTML = "";
  els.resultCount.textContent = formatVisibleCount(visibleItems.length);
  els.emptyState.hidden = items.length !== 0;

  visibleItems.forEach((item) => {
    const stock = Number(item.stock);
    const reorderPoint = Number(item.reorderPoint);
    const isLow = reorderPoint > 0 && stock <= reorderPoint;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="product-main">
          <button class="product-name-button" data-action="edit" data-id="${item.id}" type="button" title="${t("食材・資材を編集")}">
            ${escapeHtml(item.name)}
          </button>
          <span class="sku">${escapeHtml(item.sku)} / ${escapeHtml(item.location || t("未設定"))}</span>
          ${item.note ? `<span class="note">${escapeHtml(item.note)}</span>` : ""}
        </div>
      </td>
      <td>${escapeHtml(item.category)}</td>
      <td>${escapeHtml(item.supplier || t("未設定"))}</td>
      <td><span class="stock-badge ${isLow ? "low" : ""}">${formatQuantity(stock)} ${escapeHtml(item.unit)}</span></td>
      <td>
        <div class="ideal-stock">
          <span>${t("平日")} ${formatQuantity(item.idealWeekdayStock)} ${escapeHtml(item.unit)}</span>
          <span>${t("土日")} ${formatQuantity(item.idealWeekendStock)} ${escapeHtml(item.unit)}</span>
        </div>
      </td>
      <td>${formatQuantity(item.reorderPoint)} ${escapeHtml(item.unit)}</td>
      <td>${unitPriceYen.format(Number(item.unitPrice))}</td>
      <td>${Number(item.gramPrice) > 0 ? gramPriceYen.format(Number(item.gramPrice)) : "-"}</td>
      <td>
        <div class="row-actions">
          <button class="action-button receive" data-action="receive" data-id="${item.id}" title="${t("仕入れを追加")}">${t("納品")}</button>
          <button class="action-button use" data-action="use" data-id="${item.id}" title="${t("使用分を減らす")}">${t("使用")}</button>
          <button class="icon-button" data-action="edit" data-id="${item.id}" title="${t("食材・資材を編集")}" aria-label="${t("食材・資材を編集")}">✎</button>
          ${!tenancyEnabled || currentStoreRole === "admin" ? `<button class="icon-button" data-action="delete" data-id="${item.id}" title="${t("設定削除")}" aria-label="${t("設定削除")}">×</button>` : ""}
        </div>
      </td>
    `;
    els.table.append(row);
  });
}

function renderCostings() {
  const visibleCostings = getVisibleCostings();
  els.costingGrid.innerHTML = "";
  els.costingResultCount.textContent = formatVisibleCount(visibleCostings.length);
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
          <button class="icon-button" data-costing-action="move-up" data-id="${costing.id}" title="${t("上へ")}" aria-label="${t("上へ")}">↑</button>
          <button class="icon-button" data-costing-action="move-down" data-id="${costing.id}" title="${t("下へ")}" aria-label="${t("下へ")}">↓</button>
          ${isPrep ? `<button class="icon-button" data-costing-action="sync-item" data-id="${costing.id}" title="${t("反映")}" aria-label="${t("反映")}">↻</button>` : ""}
          <button class="icon-button" data-costing-action="edit" data-id="${costing.id}" title="${t("メニュー原価を編集")}" aria-label="${t("メニュー原価を編集")}">✎</button>
          ${!tenancyEnabled || currentStoreRole === "admin" ? `<button class="icon-button" data-costing-action="delete" data-id="${costing.id}" title="${t("設定削除")}" aria-label="${t("設定削除")}">×</button>` : ""}
        </div>
      </div>
      <div class="costing-metrics">
        <div>
          <span>${isPrep ? t("g単価") : t("1食原価")}</span>
          <strong>${formatCostingCost(summary.costPerServing, isPrep)}</strong>
        </div>
        <div>
          <span>${isPrep ? t("仕上がり量") : t("販売価格")}</span>
          <strong>${isPrep ? `${formatQuantity(costing.yieldCount)}g` : costing.salePrice > 0 ? yen.format(costing.salePrice) : "-"}</strong>
        </div>
        <div class="${!isPrep && summary.rate >= 35 ? "high-rate" : ""}">
          <span>${isPrep ? t("総原価") : t("原価率")}</span>
          <strong>${isPrep ? yen.format(summary.totalCost) : formatRate(summary.rate)}</strong>
        </div>
        <div>
          <span>${isPrep ? t("在庫反映") : t("粗利")}</span>
          <strong>${isPrep ? t("仕込み品") : costing.salePrice > 0 ? yen.format(costing.salePrice - summary.costPerServing) : "-"}</strong>
        </div>
      </div>
      <div class="ingredient-list" hidden>
        ${summary.lines.length ? summary.lines.map(renderIngredientLine).join("") : `<p class="muted-text">${t("材料が登録されていません。")}</p>`}
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
      <span>${escapeHtml(line.item?.name ?? line.name ?? t("材料名未設定"))}</span>
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
    const enteredUnitPrice = Number(ingredient.unitPrice) || 0;
    const itemCostingPrice = getItemCostingUnitPrice(item);
    const unitPrice = itemCostingPrice > 0 ? itemCostingPrice : enteredUnitPrice;
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

function formatCostingCost(value, isPrep = false) {
  return isPrep ? costingGramPriceYen.format(Number(value) || 0) : yen.format(Number(value) || 0);
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
  applyLanguage(els.dialog);
  document.querySelector("#name").focus();
}

function closeForm() {
  els.dialog.close();
  editingId = null;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const previousItems = [...items];
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

  const saved = await saveItems();
  if (!saved) {
    items = previousItems;
    render();
    return;
  }
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
  applyLanguage(els.movementDialog);
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
  applyLanguage(els.costingDialog);
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
      g単価
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
  refreshIngredientRowFromLinkedItem(row, { overwriteName: false });
  els.ingredientRows.append(row);
  updateIngredientRowTotal(row);
}

function getIngredientItemLabel(item) {
  const gramPrice = Number(item.gramPrice) || 0;
  const priceLabel = gramPrice > 0
    ? `g単価 ${gramPriceYen.format(gramPrice)}`
    : `g単価 ${unitPriceYen.format(Number(item.unitPrice))}`;
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
  refreshIngredientRowFromLinkedItem(row, { overwriteName: true });
}

function refreshIngredientRowFromLinkedItem(row, { overwriteName = true } = {}) {
  const item = items.find((entry) => entry.id === row.querySelector(".ingredient-item").value);
  if (!item) return;

  if (overwriteName || !row.querySelector(".ingredient-name").value.trim()) {
    row.querySelector(".ingredient-name").value = item.name;
  }
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
  const unitPrice = enteredUnitPrice > 0 ? enteredUnitPrice : itemCostingPrice;
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
  els.costingPreviewCost.textContent = formatCostingCost(summary.costPerServing, draft.category === "PREP");
  els.costingPreviewRate.textContent = draft.category === "PREP" ? `${yen.format(summary.totalCost)} / ${formatQuantity(draft.yieldCount)}g` : formatRate(summary.rate);
}

async function handleCostingSubmit(event) {
  event.preventDefault();
  const previousCostings = [...costings];
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

  const saved = await saveCostings();
  if (!saved) {
    costings = previousCostings;
    renderCostings();
    return;
  }
  closeCostingForm();
  renderCostings();
}

async function deleteCosting(id) {
  const costing = costings.find((entry) => entry.id === id);
  if (!costing || !confirm(`${costing.name}を削除しますか？`)) return;
  const previousCostings = [...costings];
  costings = costings.filter((entry) => entry.id !== id);
  const saved = await saveCostings();
  const deleted = await deleteRemoteCosting(id);
  if (!saved || !deleted) {
    costings = previousCostings;
    renderCostings();
    return;
  }
  renderCostings();
}

async function moveCosting(id, direction) {
  els.costingSortSelect.value = "manual";
  applyCostingSortOrder();
  const previousCostings = [...costings];
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
  const saved = await saveCostings();
  if (!saved) {
    costings = previousCostings;
    renderCostings();
    return;
  }
  renderCostings();
}

async function syncPrepCostingToInventory(id) {
  const costing = costings.find((entry) => entry.id === id);
  if (!costing) return;
  const previousItems = [...items];

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

  const saved = await saveItems();
  if (!saved) {
    items = previousItems;
    render();
    return;
  }
  render();
  alert(`${costing.name}を在庫マスターへ反映しました。`);
}

function applyCostingSortOrder() {
  costings = [...costings]
    .sort(compareCostingSortOrder)
    .map((costing, index) => ({ ...costing, sortOrder: index }));
}

async function deleteRemoteCosting(id) {
  if (!supabaseClient || !currentUser) return true;
  let query = supabaseClient
    .from("menu_costings")
    .delete()
    .eq("id", id);
  query = scopeToCurrentStore(query);
  const { error } = await query;

  if (error) {
    alert(`原価計算データの削除に失敗しました: ${error.message}`);
    return false;
  }
  return true;
}

async function handleMovementSubmit(event) {
  event.preventDefault();
  const previousItems = [...items];
  const previousHistory = [...history];
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

  const savedItems = await saveItems();
  const savedHistory = await saveHistory();
  if (!savedItems || !savedHistory) {
    items = previousItems;
    history = previousHistory;
    render();
    return;
  }
  closeMovementForm();
  render();
}

async function applyStockChange(id, delta, memo) {
  const item = items.find((entry) => entry.id === id);
  if (!item || !Number.isFinite(delta) || delta === 0) return;
  const previousItems = [...items];
  const previousHistory = [...history];

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

  const savedItems = await saveItems();
  const savedHistory = await saveHistory();
  if (!savedItems || !savedHistory) {
    items = previousItems;
    history = previousHistory;
    render();
    return;
  }
  render();
}

async function setCheckStock(id) {
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
  await applyStockChange(id, delta, "冷蔵庫チェックで在庫数を修正");
}

async function deleteItem(id) {
  const item = items.find((entry) => entry.id === id);
  if (!item || !confirm(`${item.name}を削除しますか？`)) return;
  const previousItems = [...items];
  items = items.filter((entry) => entry.id !== id);
  const saved = await saveItems();
  const deleted = await deleteRemoteItem(id);
  if (!saved || !deleted) {
    items = previousItems;
    render();
    return;
  }
  render();
}

async function deleteRemoteItem(id) {
  if (!supabaseClient || !currentUser) return true;
  let query = supabaseClient
    .from("inventory_items")
    .delete()
    .eq("id", id);
  query = scopeToCurrentStore(query);
  const { error } = await query;

  if (error) {
    alert(`削除に失敗しました: ${error.message}`);
    return false;
  }
  return true;
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
  link.download = `${storeSettings.businessName}-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
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
  link.download = `${storeSettings.businessName}-menu-costings-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function importCsv(file) {
  const reader = new FileReader();
  reader.onload = async () => {
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

    const previousItems = [...items];
    items = imported;
    const saved = await saveItems();
    if (!saved) {
      items = previousItems;
      render();
      return;
    }
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
els.languageSelect.addEventListener("change", (event) => changeLanguage(event.target.value));
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
els.copyOrderText.addEventListener("click", copyOrderText);
els.openSupplierOrderSettings.addEventListener("click", () => openSupplierOrderSettings());
els.openSupplierOrderSettingsTop.addEventListener("click", () => openSupplierOrderSettings());
els.openOrderMail.addEventListener("click", openOrderMail);
els.exportOrderCsv.addEventListener("click", exportOrderCsv);
els.markOrderDone.addEventListener("click", markOrderDone);
els.cancelSupplierOrderSettings.addEventListener("click", closeSupplierOrderSettings);
els.supplierOrderForm.addEventListener("submit", handleSupplierOrderSettingsSubmit);
els.deleteSupplierOrderSettings.addEventListener("click", deleteSupplierOrderSettings);
els.openStoreSettings.addEventListener("click", openStoreSettings);
els.cancelStoreSettings.addEventListener("click", closeStoreSettings);
els.storeSettingsForm.addEventListener("submit", handleStoreSettingsSubmit);
els.storeSelector.addEventListener("change", (event) => switchStore(event.target.value));
els.openQrCodes.addEventListener("click", openQrCodes);
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

[els.orderSupplierFilter, els.orderSearchInput, els.orderStockMode].forEach((element) => {
  element.addEventListener("input", renderOrders);
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

els.clearOrderFilters.addEventListener("click", () => {
  els.orderSupplierFilter.value = "";
  els.orderSearchInput.value = "";
  els.orderStockMode.value = "weekday";
  renderOrders();
});

els.orderList.addEventListener("input", (event) => {
  if (!event.target.classList.contains("order-quantity-input")) return;
  const { orderId } = event.target.dataset;
  orderQuantities[orderId] = Number(event.target.value) || 0;
  els.orderTextPreview.value = buildOrderText();
});

els.orderList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-supplier-order-action]");
  if (!button) return;
  openSupplierOrderSettings(button.dataset.supplier);
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

  if (checkAction === "move-up") moveCheckItem(id, "up");
  if (checkAction === "move-down") moveCheckItem(id, "down");
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
  await loadTenantContext();
  items = await loadItems();
  history = await loadHistory();
  costings = await loadCostings();
  supplierOrderSettings = await loadSupplierOrderSettings();
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
  supplierOrderSettings = [];
  availableStores = [];
  currentStore = null;
  tenancyEnabled = false;
  applyStoreSettings(defaultStoreSettings);
  render();
}

init();
