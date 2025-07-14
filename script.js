// Global variables
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let salesData = [];
let stockData = [];
let categories = [];
let editingSaleId = null;
let editingStockId = null;

// Global variable to store current editing client
let currentEditingClient = null;
let originalCreditsData = {};

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
  updateClientDropdown();
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

// Global variable to store search term
let currentSearchTerm = "";

// Update sales table
function updateSalesTable() {
  const tableBody = document.getElementById("salesTableBody");
  let filteredSales = salesData.filter(
    (sale) => sale.month === currentMonth && sale.year === currentYear
  );

  // Apply search filter if search term exists
  if (currentSearchTerm.trim() !== "") {
    const searchTerm = currentSearchTerm.toLowerCase();
    filteredSales = filteredSales.filter((sale) => {
      return (
        (sale.clientName &&
          sale.clientName.toLowerCase().includes(searchTerm)) ||
        (sale.invoiceNumber &&
          sale.invoiceNumber.toLowerCase().includes(searchTerm)) ||
        (sale.category && sale.category.toLowerCase().includes(searchTerm)) ||
        (sale.product && sale.product.toLowerCase().includes(searchTerm)) ||
        (sale.batchNumber &&
          sale.batchNumber.toLowerCase().includes(searchTerm))
      );
    });
  }

  tableBody.innerHTML = "";

  if (filteredSales.length === 0) {
    const row = document.createElement("tr");
    if (currentSearchTerm.trim() !== "") {
      row.innerHTML = `
        <td colspan="13" style="text-align: center; padding: 2rem; color: #666;">
          <div style="margin-bottom: 1rem;">
            <i class="fas fa-search" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
          </div>
          <h3 style="margin-bottom: 0.5rem; color: #333;">No Results Found</h3>
          <p style="margin-bottom: 1rem;">No sales match your search: "${currentSearchTerm}"</p>
          <button onclick="clearSearch()" style="background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
            <i class="fas fa-times"></i> Clear Search
          </button>
        </td>
      `;
    } else {
      row.innerHTML = `
        <td colspan="13" style="text-align: center; padding: 2rem; color: #666;">
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
    }
    tableBody.appendChild(row);
    return;
  }

  filteredSales.forEach((sale) => {
    // Calculate profit/loss for this sale
    const profitLoss = calculateSaleProfitLoss(sale);
    const profitLossClass = profitLoss >= 0 ? "profit" : "loss";
    const profitLossIcon = profitLoss >= 0 ? "📈" : "📉";

    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${formatDate(sale.date)}</td>
            <td>${sale.invoiceNumber || "N/A"}</td>
            <td>${sale.clientName || "N/A"}</td>
            <td>${sale.category}</td>
            <td>${sale.product}</td>
            <td>${sale.batchNumber || "N/A"}</td>
            <td>${sale.quantity}</td>
            <td>₨${sale.pricePerUnit.toFixed(2)}</td>
            <td>₨${sale.totalAmount.toFixed(2)}</td>
            <td>₨${(sale.credits || 0).toFixed(2)}</td>
            <td>₨${(sale.expense || 0).toFixed(2)}</td>
            <td class="${profitLossClass}">${profitLossIcon} ₨${Math.abs(
      profitLoss
    ).toFixed(2)}</td>
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
  const totalLoss = calculateLoss(filteredSales);
  const itemsSold = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalClients = new Set(filteredSales.map((sale) => sale.clientName))
    .size;
  const totalCredits = filteredSales.reduce(
    (sum, sale) => sum + (sale.credits || 0),
    0
  );

  // Calculate total receivables (all time)
  const allSales = salesData;
  const totalReceivables = allSales.reduce(
    (sum, sale) => sum + (sale.credits || 0),
    0
  );

  // Calculate yearly sales (current year)
  const yearlySales = allSales.reduce((sum, sale) => {
    const saleYear = new Date(sale.date).getFullYear();
    if (saleYear === currentYear) {
      return sum + sale.totalAmount;
    }
    return sum;
  }, 0);

  document.getElementById("totalSales").textContent = `₨${totalSales.toFixed(
    2
  )}`;
  document.getElementById("totalProfit").textContent = `₨${totalProfit.toFixed(
    2
  )}`;
  document.getElementById("totalLoss").textContent = `₨${totalLoss.toFixed(2)}`;
  document.getElementById("itemsSold").textContent = itemsSold;
  document.getElementById("totalClients").textContent = totalClients;
  document.getElementById(
    "totalCredits"
  ).textContent = `₨${totalCredits.toFixed(2)}`;
  document.getElementById(
    "totalReceivables"
  ).textContent = `₨${totalReceivables.toFixed(2)}`;
  document.getElementById("yearlySales").textContent = `₨${yearlySales.toFixed(
    2
  )}`;
}

// Calculate profit
function calculateProfit(sales) {
  console.log("=== CALCULATING TOTAL PROFIT ===");
  console.log("Number of sales to process:", sales.length);

  let totalProfit = 0;

  sales.forEach((sale, index) => {
    console.log(`Processing sale ${index + 1}/${sales.length}:`, {
      id: sale.id,
      product: sale.product,
      quantity: sale.quantity,
      pricePerUnit: sale.pricePerUnit,
    });

    const profitLoss = calculateSaleProfitLoss(sale);
    console.log(`Sale ${sale.id} profit/loss:`, profitLoss);

    if (profitLoss > 0) {
      totalProfit += profitLoss;
      console.log(`Added to total profit. New total:`, totalProfit);
    } else {
      console.log(`Not added to profit (negative or zero)`);
    }
  });

  console.log("=== FINAL TOTAL PROFIT ===");
  console.log("Total Profit:", totalProfit);
  console.log("=== END TOTAL PROFIT CALCULATION ===");

  return totalProfit;
}

// Calculate loss
function calculateLoss(sales) {
  console.log("=== CALCULATING TOTAL LOSS ===");
  console.log("Number of sales to process:", sales.length);

  let totalLoss = 0;

  sales.forEach((sale, index) => {
    console.log(`Processing sale ${index + 1}/${sales.length}:`, {
      id: sale.id,
      product: sale.product,
      quantity: sale.quantity,
      pricePerUnit: sale.pricePerUnit,
    });

    const profitLoss = calculateSaleProfitLoss(sale);
    console.log(`Sale ${sale.id} profit/loss:`, profitLoss);

    if (profitLoss < 0) {
      totalLoss += Math.abs(profitLoss);
      console.log(`Added to total loss. New total:`, totalLoss);
    } else {
      console.log(`Not added to loss (positive or zero)`);
    }
  });

  console.log("=== FINAL TOTAL LOSS ===");
  console.log("Total Loss:", totalLoss);
  console.log("=== END TOTAL LOSS CALCULATION ===");

  return totalLoss;
}

// Calculate profit/loss for a single sale
function calculateSaleProfitLoss(sale) {
  console.log("=== STARTING PROFIT CALCULATION ===");
  console.log("Sale details:", {
    id: sale.id,
    product: sale.product,
    category: sale.category,
    quantity: sale.quantity,
    pricePerUnit: sale.pricePerUnit,
    totalAmount: sale.totalAmount,
    credits: sale.credits || 0,
    expense: sale.expense || 0,
  });

  const stockItems = stockData.filter(
    (item) => item.category === sale.category && item.product === sale.product
  );

  console.log("Found stock items:", stockItems.length);
  console.log("Stock items details:", stockItems);

  if (stockItems.length > 0) {
    // Calculate weighted average cost across all purchases (including repurchases)
    let totalInvestment = 0;
    let totalAdditionalCharges = 0;
    let totalQuantity = 0;

    console.log("=== CALCULATING WEIGHTED AVERAGE ===");

    stockItems.forEach((item, index) => {
      const investment = item.totalInvestment || 0;
      const charges = item.additionalCharges || 0;
      const quantity = item.quantity;

      totalInvestment += investment;
      totalAdditionalCharges += charges;
      totalQuantity += quantity;

      console.log(`Stock item ${index + 1}:`, {
        category: item.category,
        product: item.product,
        quantity: quantity,
        pricePerUnit: item.pricePerUnit,
        totalInvestment: investment,
        additionalCharges: charges,
        batchNumber: item.batchNumber,
      });
    });

    console.log("=== TOTALS ===");
    console.log("Total Investment:", totalInvestment);
    console.log("Total Additional Charges:", totalAdditionalCharges);
    console.log("Total Quantity:", totalQuantity);

    // Calculate weighted average cost per unit
    let weightedAverageCostPerUnit;

    // If there's only one stock item, use the original purchase price
    if (stockItems.length === 1) {
      weightedAverageCostPerUnit =
        stockItems[0].pricePerUnit +
        (stockItems[0].additionalCharges / stockItems[0].totalInvestment) *
          stockItems[0].pricePerUnit;
      console.log("=== COST CALCULATION (SINGLE STOCK ITEM) ===");
      console.log(
        "Using original purchase price per unit:",
        weightedAverageCostPerUnit
      );
      console.log(
        "Reason: Single stock item found, using original purchase price"
      );
      console.log("Original purchase details:", {
        quantity: stockItems[0].quantity,
        pricePerUnit: stockItems[0].pricePerUnit,
        totalInvestment: stockItems[0].totalInvestment,
      });
    } else {
      // Use weighted average for multiple stock items
      weightedAverageCostPerUnit =
        (totalInvestment + totalAdditionalCharges) / totalQuantity;
      console.log("=== COST CALCULATION (WEIGHTED AVERAGE) ===");
      console.log(
        "Weighted Average Cost Per Unit:",
        weightedAverageCostPerUnit
      );
      console.log(
        "Formula: (Total Investment + Total Additional Charges) / Total Quantity"
      );
      console.log(
        `Formula: (${totalInvestment} + ${totalAdditionalCharges}) / ${totalQuantity} = ${weightedAverageCostPerUnit}`
      );
    }

    const sellingPrice = sale.pricePerUnit;
    const costForThisSale = weightedAverageCostPerUnit * sale.quantity;
    const revenueForThisSale = sellingPrice * sale.quantity;

    console.log("=== SALE CALCULATION ===");
    console.log("Selling Price per Unit:", sellingPrice);
    console.log("Quantity Sold:", sale.quantity);
    console.log("Cost for This Sale:", costForThisSale);
    console.log("Formula: Weighted Average Cost × Quantity");
    console.log(
      `Formula: ${weightedAverageCostPerUnit} × ${sale.quantity} = ${costForThisSale}`
    );
    console.log("Revenue for This Sale:", revenueForThisSale);
    console.log("Formula: Selling Price × Quantity");
    console.log(
      `Formula: ${sellingPrice} × ${sale.quantity} = ${revenueForThisSale}`
    );

    // Calculate profit/loss: Revenue - Cost - Credits - Expenses
    const profitLoss =
      revenueForThisSale -
      costForThisSale -
      (sale.credits || 0) -
      (sale.expense || 0);

    console.log("=== PROFIT/LOSS CALCULATION ===");
    console.log("Revenue:", revenueForThisSale);
    console.log("Cost:", costForThisSale);
    console.log("Credits:", sale.credits || 0);
    console.log("Expenses:", sale.expense || 0);
    console.log("Profit/Loss Formula: Revenue - Cost - Credits - Expenses");
    console.log(
      `Profit/Loss Formula: ${revenueForThisSale} - ${costForThisSale} - ${
        sale.credits || 0
      } - ${sale.expense || 0} = ${profitLoss}`
    );

    // Test calculation for your specific example
    if (sale.quantity === 40 && sale.pricePerUnit === 60) {
      console.log("=== TESTING YOUR EXAMPLE ===");
      console.log("Purchase: 400 × ₹54.62 = ₹21,848");
      console.log("Sale: 40 × ₹60 = ₹2,400");
      console.log("Cost for 40 units: 40 × ₹54.62 = ₹2,184.80");
      console.log("Expected Profit: ₹2,400 - ₹2,184.80 = ₹215.20");
      console.log("Actual calculated profit:", profitLoss);
      console.log("Difference:", profitLoss - 215.2);
      console.log("=== END TEST ===");
    }

    console.log("=== FINAL RESULT ===");
    console.log("Final Profit/Loss:", profitLoss);
    console.log("=== END PROFIT CALCULATION ===");

    return profitLoss;
  }

  console.log("No stock items found for this sale!");
  console.log("=== END PROFIT CALCULATION ===");
  return 0;
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
      <td colspan="11" style="text-align: center; padding: 2rem; color: #666;">
        <div style="margin-bottom: 1rem;">
          <i class="fas fa-boxes" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
        </div>
        <h3 style="margin-bottom: 0.5rem; color: #333;">No Stock Data Found</h3>
        <p style="margin-bottom: 1rem;">No stock items have been added yet</p>
        <button onclick="openAddStockForm()" style="background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
          <i class="fas fa-plus"></i> Add Your First Stock Item
        </button>
      </td>
    `;
    tableBody.appendChild(row);
    return;
  }

  stockData.forEach((item) => {
    const totalCost = item.totalInvestment + (item.additionalCharges || 0);
    const repurchaseText =
      item.repurchase === "Y" ? `Yes (${item.repurchaseCount})` : "No";

    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${item.category}</td>
            <td>${item.product}</td>
            <td>${item.quantity}</td>
            <td>₨${item.pricePerUnit.toFixed(2)}</td>
            <td>₨${item.totalInvestment.toFixed(2)}</td>
            <td>₨${(item.additionalCharges || 0).toFixed(2)}</td>
            <td>₨${totalCost.toFixed(2)}</td>
            <td>${item.batchNumber || "N/A"}</td>
            <td>${repurchaseText}</td>
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

// Search sales function
function searchSales() {
  const searchInput = document.getElementById("salesSearchInput");
  const clearBtn = document.querySelector(".clear-search-btn");

  currentSearchTerm = searchInput.value;

  // Show/hide clear button
  if (currentSearchTerm.trim() !== "") {
    clearBtn.classList.add("show");
  } else {
    clearBtn.classList.remove("show");
  }

  updateSalesTable();
}

// Clear search function
function clearSearch() {
  const searchInput = document.getElementById("salesSearchInput");
  const clearBtn = document.querySelector(".clear-search-btn");

  searchInput.value = "";
  currentSearchTerm = "";
  clearBtn.classList.remove("show");

  updateSalesTable();
}

// Change month
function changeMonth() {
  currentMonth = parseInt(document.getElementById("monthSelect").value);
  updateDisplay();
}

// Open sale modal
function openSaleModal(saleId = null) {
  const modal = document.getElementById("saleModal");
  const modalTitle = document.querySelector("#saleModal .modal-header h2");
  const form = document.getElementById("saleForm");

  // Check if modal exists
  if (!modal || !modalTitle || !form) {
    console.error("Sale modal elements not found");
    return;
  }

  // Reset form
  form.reset();
  editingSaleId = null;

  // Set default date to today
  const saleDateElement = document.getElementById("saleDate");
  const saleTotalAmountElement = document.getElementById("saleTotalAmount");

  if (saleDateElement) {
    saleDateElement.value = new Date().toISOString().split("T")[0];
  }

  if (saleTotalAmountElement) {
    saleTotalAmountElement.value = "0.00";
  }

  // Initialize dropdowns
  updateClientDropdown();
  updateCategoryOptions();

  if (saleId) {
    // Editing existing sale
    const sale = salesData.find((s) => s.id === saleId);
    if (!sale) {
      alert("Error: Sale not found!");
      return;
    }

    editingSaleId = saleId;
    modalTitle.textContent = "Edit Sale";

    // Safely set form values
    const elements = {
      saleDate: sale.date,
      saleInvoiceNumber: sale.invoiceNumber || "",
      saleClientName: sale.clientName || "",
      saleCategory: sale.category,
      saleProduct: sale.product,
      saleBatchNumber: sale.batchNumber || "",
      saleQuantity: sale.quantity,
      salePrice: sale.pricePerUnit,
      saleCredits: sale.credits || 0,
      saleExpense: sale.expense || 0,
      saleTotalAmount: sale.totalAmount.toFixed(2),
    };

    // Set each element value safely
    Object.keys(elements).forEach((elementId) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.value = elements[elementId];
      }
    });

    // Update product and batch options for editing
    updateProductOptions();
    updateBatchOptions();
  } else {
    // Adding new sale
    modalTitle.textContent = "Add New Sale";

    // Set default values safely
    const defaultElements = {
      saleDate: new Date().toISOString().split("T")[0],
      saleTotalAmount: "0.00",
    };

    Object.keys(defaultElements).forEach((elementId) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.value = defaultElements[elementId];
      }
    });
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
  const modal = document.getElementById("addStockModal");
  const modalTitle = document.querySelector("#addStockModal .modal-header h2");
  const form = document.getElementById("stockForm");

  // Reset form
  form.reset();
  editingStockId = null;

  // Initialize category options
  updateCategoryOptions();

  // Set default batch number
  document.getElementById("stockBatchNumber").value = generateBatchNumber();
  document.getElementById("stockTotalInvestment").value = "0.00";

  if (stockId) {
    // Editing existing stock
    const stock = stockData.find((s) => s.id === stockId);
    if (!stock) {
      alert("Error: Stock item not found!");
      return;
    }

    editingStockId = stockId;
    modalTitle.textContent = "Edit Stock Item";
    document.getElementById("stockCategory").value = stock.category;
    document.getElementById("stockProduct").value = stock.product;
    document.getElementById("stockQuantity").value = stock.quantity;
    document.getElementById("stockPrice").value = stock.pricePerUnit;
    document.getElementById("stockTotalInvestment").value =
      stock.totalInvestment;
    document.getElementById("stockAdditionalCharges").value =
      stock.additionalCharges || 0;
    document.getElementById("stockBatchNumber").value = stock.batchNumber;
    document.getElementById("stockRepurchase").value = stock.repurchase;
  } else {
    // Adding new stock
    modalTitle.textContent = "Add Stock Item";
    document.getElementById("stockBatchNumber").value = generateBatchNumber();
    document.getElementById("stockTotalInvestment").value = "0.00";
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
    invoiceNumber: document.getElementById("saleInvoiceNumber").value,
    clientName: document.getElementById("saleClientName").value,
    category: document.getElementById("saleCategory").value,
    product: document.getElementById("saleProduct").value,
    batchNumber: document.getElementById("saleBatchNumber").value,
    quantity: parseInt(document.getElementById("saleQuantity").value),
    pricePerUnit: parseFloat(document.getElementById("salePrice").value),
    totalAmount: parseFloat(document.getElementById("saleTotalAmount").value),
    credits: parseFloat(document.getElementById("saleCredits").value) || 0,
    expense: parseFloat(document.getElementById("saleExpense").value) || 0,
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

// Auto-calculate stock total investment
function calculateStockTotalInvestment() {
  const quantity =
    parseFloat(document.getElementById("stockQuantity").value) || 0;
  const pricePerUnit =
    parseFloat(document.getElementById("stockPrice").value) || 0;
  const totalInvestment = quantity * pricePerUnit;

  document.getElementById("stockTotalInvestment").value =
    totalInvestment.toFixed(2);
}

// Add or edit stock
function addStock() {
  const formData = {
    category: document.getElementById("stockCategory").value,
    product: document.getElementById("stockProduct").value,
    quantity: parseInt(document.getElementById("stockQuantity").value),
    pricePerUnit: parseFloat(document.getElementById("stockPrice").value),
    totalInvestment: parseFloat(
      document.getElementById("stockTotalInvestment").value
    ),
    additionalCharges:
      parseFloat(document.getElementById("stockAdditionalCharges").value) || 0,
    batchNumber: document.getElementById("stockBatchNumber").value,
    repurchase: document.getElementById("stockRepurchase").value,
    purchaseDate: new Date().toISOString().split("T")[0],
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
      repurchaseCount: calculateRepurchaseCount(
        formData.category,
        formData.product
      ),
    };

    stockData.push(stock);
    saveData();
    updateDisplay();
    closeAddStockModal();

    const repurchaseText =
      formData.repurchase === "Y"
        ? ` (Repurchase #${stock.repurchaseCount})`
        : "";
    alert(`Stock item added successfully!${repurchaseText}`);
  }
}

// Generate unique batch number
function generateBatchNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `B${timestamp}${random}`;
}

// Calculate repurchase count for a product
function calculateRepurchaseCount(category, product) {
  const existingStocks = stockData.filter(
    (item) => item.category === category && item.product === product
  );
  return existingStocks.length + 1;
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
    <h2 style="margin-bottom: 1rem; font-size: 1.8rem;">Welcome to Cambridge!</h2>
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

// Get unique clients from sales data
function getUniqueClients() {
  const clients = salesData
    .map((sale) => sale.clientName)
    .filter((client, index, arr) => client && arr.indexOf(client) === index);
  return clients.sort();
}

// Update client dropdown
function updateClientDropdown() {
  const clientDropdown = document.getElementById("saleClientDropdown");
  if (!clientDropdown) {
    return; // Element doesn't exist yet
  }

  const clients = getUniqueClients();

  clientDropdown.innerHTML = '<option value="">Select existing client</option>';
  clients.forEach((client) => {
    const option = document.createElement("option");
    option.value = client;
    option.textContent = client;
    clientDropdown.appendChild(option);
  });
}

// Select client from dropdown
function selectClient() {
  const clientDropdown = document.getElementById("saleClientDropdown");
  const clientInput = document.getElementById("saleClientName");

  if (!clientDropdown || !clientInput) {
    return; // Elements don't exist yet
  }

  if (clientDropdown.value) {
    clientInput.value = clientDropdown.value;
  }
}

// Update client dropdown when typing
function updateClientInput() {
  const clientInput = document.getElementById("saleClientName");
  const clientDropdown = document.getElementById("saleClientDropdown");

  if (!clientInput || !clientDropdown) {
    return; // Elements don't exist yet
  }

  // If user is typing, clear dropdown selection
  if (clientInput.value && clientDropdown.value !== clientInput.value) {
    clientDropdown.value = "";
  }
}

// Get unique batch numbers for a product
function getBatchNumbersForProduct(category, product) {
  const batches = stockData
    .filter((item) => item.category === category && item.product === product)
    .map((item) => item.batchNumber)
    .filter((batch, index, arr) => batch && arr.indexOf(batch) === index);
  return batches.sort();
}

// Update batch options dropdown
function updateBatchOptions() {
  const category = document.getElementById("saleCategory")?.value;
  const product = document.getElementById("saleProduct")?.value;
  const batchDropdown = document.getElementById("saleBatchDropdown");

  if (!batchDropdown) {
    return; // Element doesn't exist yet
  }

  batchDropdown.innerHTML = '<option value="">Select batch number</option>';

  if (category && product) {
    const batches = getBatchNumbersForProduct(category, product);
    batches.forEach((batch) => {
      const option = document.createElement("option");
      option.value = batch;
      option.textContent = batch;
      batchDropdown.appendChild(option);
    });
  }
}

// Select batch from dropdown
function selectBatch() {
  const batchDropdown = document.getElementById("saleBatchDropdown");
  const batchInput = document.getElementById("saleBatchNumber");

  if (!batchDropdown || !batchInput) {
    return; // Elements don't exist yet
  }

  if (batchDropdown.value) {
    batchInput.value = batchDropdown.value;
  }
}

// Auto-calculate total amount
function calculateTotalAmount() {
  const quantityElement = document.getElementById("saleQuantity");
  const priceElement = document.getElementById("salePrice");
  const totalAmountElement = document.getElementById("saleTotalAmount");

  if (!quantityElement || !priceElement || !totalAmountElement) {
    return; // Elements don't exist yet
  }

  const quantity = parseFloat(quantityElement.value) || 0;
  const pricePerUnit = parseFloat(priceElement.value) || 0;
  const totalAmount = quantity * pricePerUnit;

  totalAmountElement.value = totalAmount.toFixed(2);
}

// Open client receivables modal
function openClientReceivablesModal() {
  const modal = document.getElementById("clientReceivablesModal");
  modal.style.display = "block";
  updateReceivablesTable();
}

// Close client receivables modal
function closeClientReceivablesModal() {
  const modal = document.getElementById("clientReceivablesModal");
  modal.style.display = "none";
}

// Update receivables table
function updateReceivablesTable() {
  const tableBody = document.getElementById("receivablesTableBody");
  const clients = getUniqueClients();

  // Calculate receivables for each client
  const clientReceivables = clients
    .map((client) => {
      const clientSales = salesData.filter(
        (sale) => sale.clientName === client
      );
      const totalSales = clientSales.reduce(
        (sum, sale) => sum + sale.totalAmount,
        0
      );
      const totalCredits = clientSales.reduce(
        (sum, sale) => sum + (sale.credits || 0),
        0
      );
      const receivables = totalCredits;
      const lastSaleDate =
        clientSales.length > 0
          ? new Date(
              Math.max(...clientSales.map((sale) => new Date(sale.date)))
            )
          : null;

      return {
        clientName: client,
        totalSales: totalSales,
        totalCredits: totalCredits,
        receivables: receivables,
        lastSaleDate: lastSaleDate,
      };
    })
    .filter((client) => client.receivables > 0); // Only show clients with receivables

  // Update modal summary
  const totalReceivables = clientReceivables.reduce(
    (sum, client) => sum + client.receivables,
    0
  );
  const totalClients = clientReceivables.length;

  document.getElementById(
    "modalTotalReceivables"
  ).textContent = `₨${totalReceivables.toFixed(2)}`;
  document.getElementById("modalTotalClients").textContent = totalClients;

  // Update table
  tableBody.innerHTML = "";

  if (clientReceivables.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
        <div style="margin-bottom: 1rem;">
          <i class="fas fa-hand-holding-usd" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
        </div>
        <h3 style="margin-bottom: 0.5rem; color: #333;">No Receivables Found</h3>
        <p style="margin-bottom: 1rem;">All clients have paid their dues</p>
      </td>
    `;
    tableBody.appendChild(row);
    return;
  }

  clientReceivables.forEach((client) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${client.clientName}</td>
      <td>₨${client.totalSales.toFixed(2)}</td>
      <td>₨${client.totalCredits.toFixed(2)}</td>
      <td class="receivables-amount">₨${client.receivables.toFixed(2)}</td>
      <td>${
        client.lastSaleDate
          ? formatDate(client.lastSaleDate.toISOString().split("T")[0])
          : "N/A"
      }</td>
      <td>
        <button class="btn-edit-credits" onclick="openEditCreditsModal('${
          client.clientName
        }')">
          <i class="fas fa-edit"></i> Edit Credits
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Open edit credits modal
function openEditCreditsModal(clientName) {
  currentEditingClient = clientName;
  const modal = document.getElementById("editCreditsModal");
  const clientNameSpan = document.getElementById("editCreditsClientName");

  if (!modal || !clientNameSpan) {
    console.error("Edit credits modal elements not found");
    return;
  }

  clientNameSpan.textContent = clientName;

  // Get client sales data
  const clientSales = salesData.filter(
    (sale) => sale.clientName === clientName
  );
  const totalSales = clientSales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );
  const totalCredits = clientSales.reduce(
    (sum, sale) => sum + (sale.credits || 0),
    0
  );
  const receivables = totalCredits;

  // Update summary
  document.getElementById(
    "editCreditsTotalSales"
  ).textContent = `₨${totalSales.toFixed(2)}`;
  document.getElementById(
    "editCreditsCurrentCredits"
  ).textContent = `₨${totalCredits.toFixed(2)}`;
  document.getElementById(
    "editCreditsReceivables"
  ).textContent = `₨${receivables.toFixed(2)}`;

  // Populate table with client sales
  updateEditCreditsTable(clientSales);

  modal.style.display = "block";
}

// Close edit credits modal
function closeEditCreditsModal() {
  const modal = document.getElementById("editCreditsModal");
  if (modal) {
    modal.style.display = "none";
  }
  currentEditingClient = null;
  originalCreditsData = {};
}

// Update edit credits table
function updateEditCreditsTable(clientSales) {
  const tableBody = document.getElementById("editCreditsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";
  originalCreditsData = {};

  if (clientSales.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
        <div style="margin-bottom: 1rem;">
          <i class="fas fa-file-invoice" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
        </div>
        <h3 style="margin-bottom: 0.5rem; color: #333;">No Sales Found</h3>
        <p style="margin-bottom: 1rem;">No sales recorded for this client</p>
      </td>
    `;
    tableBody.appendChild(row);
    return;
  }

  clientSales.forEach((sale) => {
    const row = document.createElement("tr");
    const originalCredit = sale.credits || 0;
    originalCreditsData[sale.id] = originalCredit;

    row.innerHTML = `
      <td>${formatDate(sale.date)}</td>
      <td>${sale.invoiceNumber || "N/A"}</td>
      <td>${sale.product}</td>
      <td>₨${sale.totalAmount.toFixed(2)}</td>
      <td>₨${originalCredit.toFixed(2)}</td>
      <td>
        <input 
          type="number" 
          class="credit-input" 
          value="${originalCredit.toFixed(2)}" 
          step="0.01" 
          min="0" 
          max="${sale.totalAmount}"
          data-sale-id="${sale.id}"
          onchange="markCreditChanged(this)"
        />
      </td>
      <td>
        <button class="btn-edit-credits" onclick="markAsPaid(${sale.id})">
          <i class="fas fa-check"></i> Mark Paid
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Mark credit as changed
function markCreditChanged(input) {
  const saleId = input.dataset.saleId;
  const originalCredit = originalCreditsData[saleId] || 0;
  const newCredit = parseFloat(input.value) || 0;
  const maxCredit = parseFloat(input.max) || 0;

  // Validate that credit doesn't exceed total amount
  if (newCredit > maxCredit) {
    alert(`Credit cannot exceed the total amount of ₨${maxCredit.toFixed(2)}`);
    input.value = maxCredit.toFixed(2);
    return;
  }

  // Validate that credit is not negative
  if (newCredit < 0) {
    alert("Credit cannot be negative");
    input.value = "0.00";
    return;
  }

  if (newCredit !== originalCredit) {
    input.classList.add("credit-changed");
  } else {
    input.classList.remove("credit-changed");
  }
}

// Mark sale as paid (set credits to 0)
function markAsPaid(saleId) {
  const input = document.querySelector(`input[data-sale-id="${saleId}"]`);
  if (input) {
    input.value = "0.00";
    input.classList.add("credit-changed", "credit-paid");
  }
}

// Mark all sales as paid for current client
function markAllAsPaid() {
  if (!currentEditingClient) {
    alert("No client selected");
    return;
  }

  const creditInputs = document.querySelectorAll(".credit-input");
  let hasUnpaidCredits = false;

  creditInputs.forEach((input) => {
    const currentCredit = parseFloat(input.value) || 0;
    if (currentCredit > 0) {
      hasUnpaidCredits = true;
      input.value = "0.00";
      input.classList.add("credit-changed", "credit-paid");
    }
  });

  if (!hasUnpaidCredits) {
    alert("All sales are already marked as paid!");
  } else {
    alert("All sales marked as paid! Click 'Save Changes' to confirm.");
  }
}

// Save credits changes
function saveCreditsChanges() {
  if (!currentEditingClient) {
    alert("No client selected for editing");
    return;
  }

  const creditInputs = document.querySelectorAll(".credit-input");
  let hasChanges = false;
  const changes = [];

  creditInputs.forEach((input) => {
    const saleId = parseInt(input.dataset.saleId);
    const newCredit = parseFloat(input.value) || 0;
    const originalCredit = originalCreditsData[saleId] || 0;

    if (newCredit !== originalCredit) {
      hasChanges = true;
      changes.push({
        saleId: saleId,
        oldCredit: originalCredit,
        newCredit: newCredit,
      });
    }
  });

  if (!hasChanges) {
    alert("No changes to save");
    return;
  }

  // Apply changes to sales data
  changes.forEach((change) => {
    const sale = salesData.find((s) => s.id === change.saleId);
    if (sale) {
      sale.credits = change.newCredit;
    }
  });

  // Save data and update displays
  saveData();
  updateDisplay();
  updateReceivablesTable();

  alert(`Credits updated successfully for ${currentEditingClient}!`);
  closeEditCreditsModal();
}
