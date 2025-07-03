// Global variables
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let salesData = [];
let stockData = [];
let categories = [];
let editingSaleId = null;
let editingStockId = null;

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication first
  if (typeof authManager !== "undefined") {
    authManager.checkAuth();
  }

  loadData();
  setCurrentMonth();
  updateDisplay();
  setupEventListeners();
  setupAuthUI();
});

// Load data from localStorage
function loadData() {
  // Use the data manager to load data
  dataManager.loadFromStorage();
  salesData = dataManager.salesData;
  stockData = dataManager.stockData;
  categories = dataManager.categories;

  // Check if user wants to start fresh (you can remove this check later)
  const startFresh = localStorage.getItem("startFresh");
  if (
    startFresh === "true" ||
    (salesData.length === 0 && stockData.length === 0)
  ) {
    // Clear any existing data to ensure fresh start
    salesData = [];
    stockData = [];
    categories = [];
    dataManager.salesData = [];
    dataManager.stockData = [];
    dataManager.categories = [];
    dataManager.saveToStorage();
    localStorage.removeItem("startFresh");
  }

  // Initialize with empty categories if none exist
  if (categories.length === 0) {
    categories = [];
    dataManager.categories = categories;
    dataManager.saveToStorage();
  }
}

// Sample data initialization is now handled by the data manager utility

// Save data to localStorage
function saveData() {
  dataManager.salesData = salesData;
  dataManager.stockData = stockData;
  dataManager.categories = categories;
  dataManager.saveToStorage();
}

// Set current month in dropdown
function setCurrentMonth() {
  document.getElementById("monthSelect").value = currentMonth;
}

// Update display
function updateDisplay() {
  updateSalesTable();
  updateSummaryCards();
  updateCategoryOptions();
  updateStockTable();
  updateCategoryList();

  // Show/hide welcome message based on data existence
  const welcomeMessage = document.getElementById("welcomeMessage");
  if (salesData.length === 0 && stockData.length === 0) {
    showWelcomeMessage();
  } else if (welcomeMessage) {
    welcomeMessage.remove();
  }
}

// Update sales table
function updateSalesTable() {
  const tableBody = document.getElementById("salesTableBody");
  const filteredSales = salesData.filter(
    (sale) => sale.month === currentMonth && sale.year === currentYear
  );

  tableBody.innerHTML = "";

  if (filteredSales.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
        <div style="margin-bottom: 1rem;">
          <i class="fas fa-chart-line" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
        </div>
        <h3 style="margin-bottom: 0.5rem; color: #333;">No Sales Data Found</h3>
        <p style="margin-bottom: 1rem;">No sales recorded for ${getMonthName(
          currentMonth
        )} ${currentYear}</p>
        <button onclick="openSaleModal()" style="background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
          <i class="fas fa-plus"></i> Add Your First Sale
        </button>
      </td>
    `;
    tableBody.appendChild(row);
    return;
  }

  filteredSales.forEach((sale) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${formatDate(sale.date)}</td>
            <td>${sale.category}</td>
            <td>${sale.product}</td>
            <td>${sale.quantity}</td>
            <td>₨${sale.pricePerUnit.toFixed(2)}</td>
            <td>₨${sale.totalAmount.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editSale(${sale.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteSale(${sale.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

// Update summary cards
function updateSummaryCards() {
  const filteredSales = salesData.filter(
    (sale) => sale.month === currentMonth && sale.year === currentYear
  );

  const totalSales = filteredSales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );
  const totalProfit = calculateProfit(filteredSales);
  const itemsSold = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);

  document.getElementById("totalSales").textContent = `₨${totalSales.toFixed(
    2
  )}`;
  document.getElementById("totalProfit").textContent = `₨${totalProfit.toFixed(
    2
  )}`;
  document.getElementById("itemsSold").textContent = itemsSold;
}

// Calculate profit
function calculateProfit(sales) {
  let totalProfit = 0;

  sales.forEach((sale) => {
    const stockItem = stockData.find(
      (item) => item.category === sale.category && item.product === sale.product
    );

    if (stockItem) {
      const costPrice = stockItem.pricePerUnit;
      const sellingPrice = sale.pricePerUnit;
      const profit = (sellingPrice - costPrice) * sale.quantity;
      totalProfit += profit;
    }
  });

  return totalProfit;
}

// Update category options
function updateCategoryOptions() {
  const saleCategory = document.getElementById("saleCategory");
  const stockCategory = document.getElementById("stockCategory");

  saleCategory.innerHTML = '<option value="">Select Category</option>';
  stockCategory.innerHTML = '<option value="">Select Category</option>';

  categories.forEach((category) => {
    saleCategory.innerHTML += `<option value="${category}">${category}</option>`;
    stockCategory.innerHTML += `<option value="${category}">${category}</option>`;
  });
}

// Update stock table
function updateStockTable() {
  const tableBody = document.getElementById("stockTableBody");
  tableBody.innerHTML = "";

  if (stockData.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
        <div style="margin-bottom: 1rem;">
          <i class="fas fa-boxes" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
        </div>
        <h3 style="margin-bottom: 0.5rem; color: #333;">No Stock Items Found</h3>
        <p style="margin-bottom: 1rem;">Start by adding your first stock item</p>
        <button onclick="openAddStockForm()" style="background: #28a745; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
          <i class="fas fa-plus"></i> Add Stock Item
        </button>
      </td>
    `;
    tableBody.appendChild(row);
    return;
  }

  stockData.forEach((item) => {
    const row = document.createElement("tr");
    const stockClass =
      item.quantity <= 10
        ? "low-stock"
        : item.quantity <= 50
        ? "medium-stock"
        : "normal-stock";
    const stockIcon =
      item.quantity <= 10 ? "🔴" : item.quantity <= 50 ? "🟡" : "🟢";

    row.innerHTML = `
            <td>${item.category}</td>
            <td>${item.product}</td>
            <td class="${stockClass}">${stockIcon} ${item.quantity}</td>
            <td>₨${item.pricePerUnit.toFixed(2)}</td>
            <td>₨${item.totalValue.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editStock(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteStock(${
                      item.id
                    })">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

// Update category list
function updateCategoryList() {
  const categoryList = document.getElementById("categoryList");
  categoryList.innerHTML = "";

  if (categories.length === 0) {
    categoryList.innerHTML = `
      <div style="text-align: center; padding: 1rem; color: #666; background: #f8f9fa; border-radius: 8px; margin: 1rem 0;">
        <i class="fas fa-tags" style="font-size: 2rem; color: #ddd; margin-bottom: 0.5rem;"></i>
        <p style="margin: 0;">No categories added yet</p>
        <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">Add your first category above</p>
      </div>
    `;
    return;
  }

  categories.forEach((category) => {
    const tag = document.createElement("div");
    tag.className = "category-tag";
    tag.innerHTML = `
            ${category}
            <button class="remove-category" onclick="removeCategory('${category}')">
                <i class="fas fa-times"></i>
            </button>
        `;
    categoryList.appendChild(tag);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Sale form submission
  document.getElementById("saleForm").addEventListener("submit", function (e) {
    e.preventDefault();
    addSale();
  });

  // Stock form submission
  document.getElementById("stockForm").addEventListener("submit", function (e) {
    e.preventDefault();
    addStock();
  });

  // Product selection change
  document
    .getElementById("saleProduct")
    .addEventListener("change", function () {
      showStockDetails();
    });
}

// Change month
function changeMonth() {
  currentMonth = parseInt(document.getElementById("monthSelect").value);
  updateDisplay();
}

// Open sale modal
function openSaleModal(saleId = null) {
  editingSaleId = saleId;
  const modal = document.getElementById("saleModal");
  const modalTitle = modal.querySelector(".modal-header h2");
  const form = document.getElementById("saleForm");

  if (saleId) {
    // Editing existing sale
    const sale = salesData.find((s) => s.id === saleId);
    if (sale) {
      modalTitle.textContent = "Edit Sale";
      document.getElementById("saleDate").value = sale.date;
      document.getElementById("saleCategory").value = sale.category;
      updateProductOptions();
      document.getElementById("saleProduct").value = sale.product;
      document.getElementById("saleQuantity").value = sale.quantity;
      document.getElementById("salePrice").value = sale.pricePerUnit;
      showStockDetails();
    }
  } else {
    // Adding new sale
    modalTitle.textContent = "Add New Sale";
    form.reset();
    document.getElementById("saleDate").value = new Date()
      .toISOString()
      .split("T")[0];
  }

  modal.style.display = "block";
}

// Close sale modal
function closeSaleModal() {
  document.getElementById("saleModal").style.display = "none";
  document.getElementById("saleForm").reset();
  editingSaleId = null;

  // Remove stock info if exists
  const stockInfo = document.getElementById("stockInfo");
  if (stockInfo) {
    stockInfo.remove();
  }
}

// Open stock modal
function openStockModal() {
  document.getElementById("stockModal").style.display = "block";
}

// Close stock modal
function closeStockModal() {
  document.getElementById("stockModal").style.display = "none";
}

// Open add stock modal
function openAddStockForm(stockId = null) {
  editingStockId = stockId;
  const modal = document.getElementById("addStockModal");
  const modalTitle = modal.querySelector(".modal-header h2");
  const form = document.getElementById("stockForm");

  if (stockId) {
    // Editing existing stock
    const stock = stockData.find((s) => s.id === stockId);
    if (stock) {
      modalTitle.textContent = "Edit Stock Item";
      document.getElementById("stockCategory").value = stock.category;
      document.getElementById("stockProduct").value = stock.product;
      document.getElementById("stockQuantity").value = stock.quantity;
      document.getElementById("stockPrice").value = stock.pricePerUnit;
    }
  } else {
    // Adding new stock
    modalTitle.textContent = "Add Stock Item";
    form.reset();
  }

  modal.style.display = "block";
}

// Close add stock modal
function closeAddStockModal() {
  document.getElementById("addStockModal").style.display = "none";
  document.getElementById("stockForm").reset();
  editingStockId = null;
}

// Add or edit sale
function addSale() {
  const formData = {
    date: document.getElementById("saleDate").value,
    category: document.getElementById("saleCategory").value,
    product: document.getElementById("saleProduct").value,
    quantity: parseInt(document.getElementById("saleQuantity").value),
    pricePerUnit: parseFloat(document.getElementById("salePrice").value),
  };

  if (editingSaleId) {
    // Editing existing sale
    const existingSale = salesData.find((s) => s.id === editingSaleId);
    if (!existingSale) {
      alert("Error: Sale not found!");
      return;
    }

    // Restore old stock quantity
    const oldStockItem = stockData.find(
      (item) =>
        item.category === existingSale.category &&
        item.product === existingSale.product
    );
    if (oldStockItem) {
      oldStockItem.quantity += existingSale.quantity;
      oldStockItem.totalValue =
        oldStockItem.quantity * oldStockItem.pricePerUnit;
    }

    // Check if product changed
    const isSameProduct =
      existingSale.category === formData.category &&
      existingSale.product === formData.product;

    if (!isSameProduct) {
      // Product changed, validate new stock
      const newStockItem = stockData.find(
        (item) =>
          item.category === formData.category &&
          item.product === formData.product
      );

      if (!newStockItem) {
        alert("Error: New product is not available in stock!");
        return;
      }

      if (newStockItem.quantity < formData.quantity) {
        alert(
          `Error: Insufficient stock! Available: ${newStockItem.quantity}, Requested: ${formData.quantity}`
        );
        return;
      }

      // Update new stock quantity
      newStockItem.quantity -= formData.quantity;
      newStockItem.totalValue =
        newStockItem.quantity * newStockItem.pricePerUnit;
    } else {
      // Same product, check if quantity increased
      const stockItem = stockData.find(
        (item) =>
          item.category === formData.category &&
          item.product === formData.product
      );

      const quantityDifference = formData.quantity - existingSale.quantity;
      if (quantityDifference > 0 && stockItem.quantity < quantityDifference) {
        alert(
          `Error: Insufficient stock! Available: ${stockItem.quantity}, Additional needed: ${quantityDifference}`
        );
        return;
      }

      // Update stock quantity
      stockItem.quantity -= quantityDifference;
      stockItem.totalValue = stockItem.quantity * stockItem.pricePerUnit;
    }

    // Update sale data
    Object.assign(existingSale, {
      ...formData,
      totalAmount: formData.quantity * formData.pricePerUnit,
      month: new Date(formData.date).getMonth() + 1,
      year: new Date(formData.date).getFullYear(),
    });

    saveData();
    updateDisplay();
    closeSaleModal();
    alert("Sale updated successfully!");
  } else {
    // Adding new sale
    const stockItem = stockData.find(
      (item) =>
        item.category === formData.category && item.product === formData.product
    );

    if (!stockItem) {
      alert("Error: This product is not available in stock!");
      return;
    }

    if (stockItem.quantity < formData.quantity) {
      alert(
        `Error: Insufficient stock! Available: ${stockItem.quantity}, Requested: ${formData.quantity}`
      );
      return;
    }

    // Update stock quantity
    stockItem.quantity -= formData.quantity;
    stockItem.totalValue = stockItem.quantity * stockItem.pricePerUnit;

    const sale = {
      id: Date.now(),
      ...formData,
      totalAmount: formData.quantity * formData.pricePerUnit,
      month: new Date(formData.date).getMonth() + 1,
      year: new Date(formData.date).getFullYear(),
    };

    salesData.push(sale);
    saveData();
    updateDisplay();
    closeSaleModal();

    alert(
      `Sale added successfully! Stock updated: ${stockItem.product} - ${stockItem.quantity} remaining`
    );
  }
}

// Add or edit stock
function addStock() {
  const formData = {
    category: document.getElementById("stockCategory").value,
    product: document.getElementById("stockProduct").value,
    quantity: parseInt(document.getElementById("stockQuantity").value),
    pricePerUnit: parseFloat(document.getElementById("stockPrice").value),
  };

  if (editingStockId) {
    // Editing existing stock
    const existingStock = stockData.find((s) => s.id === editingStockId);
    if (!existingStock) {
      alert("Error: Stock item not found!");
      return;
    }

    // Update stock data
    Object.assign(existingStock, {
      ...formData,
      totalValue: formData.quantity * formData.pricePerUnit,
    });

    saveData();
    updateDisplay();
    closeAddStockModal();
    alert("Stock item updated successfully!");
  } else {
    // Adding new stock
    const stock = {
      id: Date.now(),
      ...formData,
      totalValue: formData.quantity * formData.pricePerUnit,
    };

    stockData.push(stock);
    saveData();
    updateDisplay();
    closeAddStockModal();
    alert("Stock item added successfully!");
  }
}

// Add category
function addCategory() {
  const categoryInput = document.getElementById("newCategory");
  const category = categoryInput.value.trim();

  if (category && !categories.includes(category)) {
    categories.push(category);
    saveData();
    updateDisplay();
    categoryInput.value = "";
  }
}

// Remove category
function removeCategory(category) {
  if (confirm(`Are you sure you want to remove the category "${category}"?`)) {
    categories = categories.filter((c) => c !== category);
    stockData = stockData.filter((item) => item.category !== category);
    salesData = salesData.filter((sale) => sale.category !== category);
    saveData();
    updateDisplay();
  }
}

// Update product options based on selected category
function updateProductOptions() {
  const category = document.getElementById("saleCategory").value;
  const productSelect = document.getElementById("saleProduct");

  productSelect.innerHTML = '<option value="">Select Product</option>';

  if (category) {
    const products = stockData
      .filter((item) => item.category === category)
      .map((item) => item.product);

    products.forEach((product) => {
      const stockItem = stockData.find(
        (item) => item.category === category && item.product === product
      );
      const stockStatus =
        stockItem.quantity <= 10
          ? " (Low Stock)"
          : stockItem.quantity <= 50
          ? " (Medium Stock)"
          : "";
      productSelect.innerHTML += `<option value="${product}">${product} - ${stockItem.quantity} available${stockStatus}</option>`;
    });
  }
}

// Edit sale
function editSale(id) {
  openSaleModal(id);
}

// Delete sale
function deleteSale(id) {
  if (confirm("Are you sure you want to delete this sale?")) {
    const saleToDelete = salesData.find((s) => s.id === id);

    if (saleToDelete) {
      // Restore stock quantity
      const stockItem = stockData.find(
        (item) =>
          item.category === saleToDelete.category &&
          item.product === saleToDelete.product
      );

      if (stockItem) {
        stockItem.quantity += saleToDelete.quantity;
        stockItem.totalValue = stockItem.quantity * stockItem.pricePerUnit;
      }
    }

    salesData = salesData.filter((s) => s.id !== id);
    saveData();
    updateDisplay();

    if (saleToDelete) {
      alert(
        `Sale deleted! Stock restored: ${saleToDelete.product} - ${saleToDelete.quantity} units added back to stock`
      );
    }
  }
}

// Edit stock
function editStock(id) {
  openAddStockForm(id);
}

// Delete stock
function deleteStock(id) {
  if (confirm("Are you sure you want to delete this stock item?")) {
    stockData = stockData.filter((s) => s.id !== id);
    saveData();
    updateDisplay();
  }
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN");
}

// Get month name
function getMonthName(monthNumber) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[monthNumber - 1];
}

// Close modals when clicking outside
window.onclick = function (event) {
  const saleModal = document.getElementById("saleModal");
  const stockModal = document.getElementById("stockModal");
  const addStockModal = document.getElementById("addStockModal");

  if (event.target === saleModal) {
    closeSaleModal();
  }
  if (event.target === stockModal) {
    closeStockModal();
  }
  if (event.target === addStockModal) {
    closeAddStockModal();
  }
};

// Show stock details when product is selected
function showStockDetails() {
  const category = document.getElementById("saleCategory").value;
  const product = document.getElementById("saleProduct").value;

  if (category && product) {
    const stockItem = stockData.find(
      (item) => item.category === category && item.product === product
    );

    if (stockItem) {
      const stockInfo = document.getElementById("stockInfo");
      if (!stockInfo) {
        // Create stock info element if it doesn't exist
        const stockInfoDiv = document.createElement("div");
        stockInfoDiv.id = "stockInfo";
        stockInfoDiv.className = "stock-info";
        document
          .getElementById("saleForm")
          .insertBefore(stockInfoDiv, document.querySelector(".form-actions"));
      }

      const stockStatus =
        stockItem.quantity <= 10
          ? "Low Stock"
          : stockItem.quantity <= 50
          ? "Medium Stock"
          : "Good Stock";
      const stockColor =
        stockItem.quantity <= 10
          ? "#dc3545"
          : stockItem.quantity <= 50
          ? "#ffc107"
          : "#28a745";

      document.getElementById("stockInfo").innerHTML = `
        <div class="stock-details" style="border-left: 4px solid ${stockColor}; padding-left: 1rem; margin: 1rem 0;">
          <h4>Stock Information</h4>
          <p><strong>Available:</strong> ${stockItem.quantity} units</p>
          <p><strong>Cost Price:</strong> ₨${stockItem.pricePerUnit.toFixed(
            2
          )}</p>
          <p><strong>Status:</strong> <span style="color: ${stockColor};">${stockStatus}</span></p>
        </div>
      `;
    }
  }
}

// Show welcome message for new users
function showWelcomeMessage() {
  const container = document.querySelector(".container");

  // Check if welcome message already exists
  if (document.getElementById("welcomeMessage")) {
    return;
  }

  const welcomeDiv = document.createElement("div");
  welcomeDiv.id = "welcomeMessage";
  welcomeDiv.style.cssText = `
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 2rem;
    border-radius: 15px;
    text-align: center;
    margin-bottom: 2rem;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  `;

  welcomeDiv.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <i class="fas fa-truck" style="font-size: 4rem; margin-bottom: 1rem;"></i>
    </div>
    <h2 style="margin-bottom: 1rem; font-size: 1.8rem;">Welcome to Medi-Care!</h2>
    <p style="margin-bottom: 1.5rem; font-size: 1.1rem; opacity: 0.9;">
      Your complete distribution management solution
    </p>
    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
      <button onclick="openStockModal()" style="background: rgba(255,255,255,0.2); color: white; border: 2px solid white; padding: 0.75rem 1.5rem; border-radius: 25px; cursor: pointer; transition: all 0.3s;">
        <i class="fas fa-boxes"></i> Setup Stock
      </button>
      <button onclick="openSaleModal()" style="background: white; color: #667eea; border: none; padding: 0.75rem 1.5rem; border-radius: 25px; cursor: pointer; transition: all 0.3s;">
        <i class="fas fa-plus"></i> Add First Sale
      </button>
    </div>
    <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.2);">
      <p style="font-size: 0.9rem; opacity: 0.8;">
        <strong>Getting Started:</strong> First add your product categories and stock items, then start recording sales!
      </p>
    </div>
  `;

  // Insert welcome message at the beginning of the container
  container.insertBefore(welcomeDiv, container.firstChild);
}

// Clear all data completely
function clearAllData() {
  if (
    confirm(
      "This will permanently delete ALL data including sales, stock, and categories. Are you sure?"
    )
  ) {
    // Clear global variables
    salesData = [];
    stockData = [];
    categories = [];
    editingSaleId = null;
    editingStockId = null;

    // Clear localStorage completely
    localStorage.removeItem("salesData");
    localStorage.removeItem("stockData");
    localStorage.removeItem("categories");
    localStorage.removeItem("backup");

    // Clear data manager
    dataManager.salesData = [];
    dataManager.stockData = [];
    dataManager.categories = [];
    dataManager.saveToStorage();

    // Update display
    updateDisplay();

    alert("All data has been cleared successfully! You can now start fresh.");
  }
}

// These functions are now handled by the data manager utility
// The exportData, importData, and loadSampleData functions are defined in utils/data-manager.js

// Setup authentication UI
function setupAuthUI() {
  // Add logout button to header if it doesn't exist
  const header = document.querySelector(".header");
  if (header && !document.getElementById("logoutBtn")) {
    const userInfo = authManager.getCurrentUser();
    if (userInfo) {
      const userSection = document.createElement("div");
      userSection.style.cssText = `
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-left: auto;
      `;

      const userName = document.createElement("span");
      userName.textContent = `Welcome, ${userInfo.name}`;
      userName.style.cssText = `
        color: #333;
        font-weight: 500;
      `;

      const logoutBtn = document.createElement("button");
      logoutBtn.id = "logoutBtn";
      logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
      logoutBtn.style.cssText = `
        background: #dc3545;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.3s;
      `;

      logoutBtn.addEventListener("click", function () {
        if (confirm("Are you sure you want to logout?")) {
          authManager.logout();
          window.location.href = "login.html";
        }
      });

      userSection.appendChild(userName);
      userSection.appendChild(logoutBtn);
      header.appendChild(userSection);
    }
  }

  // Setup session timeout warning
  setupSessionTimeoutWarning();
}

// Setup session timeout warning
function setupSessionTimeoutWarning() {
  const session = authManager.getCurrentSession();
  if (!session) return;

  const sessionExpiry = new Date(session.expiresAt);
  const now = new Date();
  const timeUntilExpiry = sessionExpiry - now;

  // Show warning 1 hour before expiry
  const warningTime = 60 * 60 * 1000; // 1 hour in milliseconds

  if (timeUntilExpiry > warningTime) {
    const warningDelay = timeUntilExpiry - warningTime;
    setTimeout(() => {
      showSessionWarning();
    }, warningDelay);
  } else if (timeUntilExpiry > 0) {
    // Session expires soon, show warning immediately
    showSessionWarning();
  }
}

// Show session timeout warning
function showSessionWarning() {
  const warningDiv = document.createElement("div");
  warningDiv.id = "sessionWarning";
  warningDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f59e0b;
    color: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    max-width: 300px;
    font-size: 0.9rem;
  `;

  warningDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
      <i class="fas fa-exclamation-triangle"></i>
      <strong>Session Expiring Soon</strong>
    </div>
    <p style="margin: 0 0 0.5rem 0;">Your session will expire in 1 hour. Please save your work.</p>
    <div style="display: flex; gap: 0.5rem;">
      <button onclick="extendSession()" style="background: #059669; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
        Extend Session
      </button>
      <button onclick="dismissWarning()" style="background: transparent; color: white; border: 1px solid white; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
        Dismiss
      </button>
    </div>
  `;

  document.body.appendChild(warningDiv);
}

// Extend session
function extendSession() {
  const session = authManager.getCurrentSession();
  if (session) {
    // Extend session by 7 more days
    session.expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    authManager.saveAuthData();

    // Remove warning
    dismissWarning();

    // Show success message
    alert("Session extended successfully!");
  }
}

// Dismiss warning
function dismissWarning() {
  const warning = document.getElementById("sessionWarning");
  if (warning) {
    warning.remove();
  }
}

// Logout from stock modal
function logoutFromStockModal() {
  if (confirm("Are you sure you want to logout?")) {
    authManager.logout();
    closeStockModal();
    window.location.href = "login.html";
  }
}

// Force fresh start - run this in browser console if you see old data
function forceFreshStart() {
  localStorage.clear();
  location.reload();
}
