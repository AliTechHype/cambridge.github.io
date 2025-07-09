// Data Manager Utility for Distribution Management System
// This utility provides functions to export and import data to/from JSON files

class DataManager {
  constructor() {
    this.salesData = [];
    this.stockData = [];
    this.categories = [];
  }

  // Load data from localStorage
  loadFromStorage() {
    this.salesData = JSON.parse(localStorage.getItem("salesData")) || [];
    this.stockData = JSON.parse(localStorage.getItem("stockData")) || [];
    this.categories = JSON.parse(localStorage.getItem("categories")) || [];
  }

  // Save data to localStorage
  saveToStorage() {
    localStorage.setItem("salesData", JSON.stringify(this.salesData));
    localStorage.setItem("stockData", JSON.stringify(this.stockData));
    localStorage.setItem("categories", JSON.stringify(this.categories));
  }

  // Export data to JSON file
  exportData() {
    const data = {
      sales: this.salesData,
      stock: this.stockData,
      categories: this.categories,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `distribution_data_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import data from JSON file
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);

          // Validate data structure
          if (!data.sales || !data.stock || !data.categories) {
            throw new Error(
              "Invalid data format. File must contain sales, stock, and categories."
            );
          }

          // Update data
          this.salesData = data.sales;
          this.stockData = data.stock;
          this.categories = data.categories;

          // Save to localStorage
          this.saveToStorage();

          resolve({
            success: true,
            message: "Data imported successfully!",
            stats: {
              sales: this.salesData.length,
              stock: this.stockData.length,
              categories: this.categories.length,
            },
          });
        } catch (error) {
          reject({
            success: false,
            message: "Error importing data: " + error.message,
          });
        }
      };

      reader.onerror = () => {
        reject({
          success: false,
          message: "Error reading file",
        });
      };

      reader.readAsText(file);
    });
  }

  // Load sample data (only when explicitly requested)
  loadSampleData() {
    const sampleData = {
      sales: [
        {
          id: 1,
          date: "2024-01-15",
          clientName: "City Hospital",
          category: "Drips",
          product: "Normal Saline",
          batchNumber: "NS001",
          quantity: 50,
          pricePerUnit: 250.0,
          totalAmount: 12500.0,
          credits: 0,
          expense: 100,
          month: 1,
          year: 2024,
        },
        {
          id: 2,
          date: "2024-01-20",
          clientName: "Medical Center",
          category: "Medicines",
          product: "Paracetamol",
          batchNumber: "PC001",
          quantity: 100,
          pricePerUnit: 50.0,
          totalAmount: 5000.0,
          credits: 200,
          expense: 50,
          month: 1,
          year: 2024,
        },
      ],
      stock: [
        {
          id: 1,
          category: "Drips",
          product: "Normal Saline",
          quantity: 200,
          pricePerUnit: 200.0,
          totalInvestment: 40000.0,
          additionalCharges: 5000.0,
          repurchase: "N",
          repurchaseCount: 1,
          batchNumber: "B1703123456789123",
          purchaseDate: "2024-01-01",
          totalValue: 40000.0,
        },
        {
          id: 2,
          category: "Medicines",
          product: "Paracetamol",
          quantity: 500,
          pricePerUnit: 40.0,
          totalInvestment: 20000.0,
          additionalCharges: 2000.0,
          repurchase: "Y",
          repurchaseCount: 2,
          batchNumber: "B1703123456789456",
          purchaseDate: "2024-01-10",
          totalValue: 20000.0,
        },
        {
          id: 3,
          category: "Drips",
          product: "Normal Saline",
          quantity: 150,
          pricePerUnit: 220.0,
          totalInvestment: 33000.0,
          additionalCharges: 3000.0,
          repurchase: "Y",
          repurchaseCount: 2,
          batchNumber: "B1703123456789789",
          purchaseDate: "2024-01-15",
          totalValue: 33000.0,
        },
      ],
      categories: ["Drips", "Medicines", "Equipment"],
    };

    this.salesData = sampleData.sales;
    this.stockData = sampleData.stock;
    this.categories = sampleData.categories;
    this.saveToStorage();
  }

  // Get data statistics
  getStats() {
    const totalSalesValue = this.salesData.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const totalStockValue = this.stockData.reduce(
      (sum, item) => sum + item.totalValue,
      0
    );

    return {
      totalSales: this.salesData.length,
      totalStockItems: this.stockData.length,
      totalCategories: this.categories.length,
      totalSalesValue: totalSalesValue,
      totalStockValue: totalStockValue,
    };
  }

  // Clear all data
  clearData() {
    this.salesData = [];
    this.stockData = [];
    this.categories = [];
    this.saveToStorage();
  }

  // Backup current data
  createBackup() {
    const backup = {
      sales: [...this.salesData],
      stock: [...this.stockData],
      categories: [...this.categories],
      backupDate: new Date().toISOString(),
    };

    localStorage.setItem("backup", JSON.stringify(backup));
    return backup;
  }

  // Restore from backup
  restoreFromBackup() {
    const backup = localStorage.getItem("backup");
    if (backup) {
      const data = JSON.parse(backup);
      this.salesData = data.sales;
      this.stockData = data.stock;
      this.categories = data.categories;
      this.saveToStorage();
      return true;
    }
    return false;
  }
}

// Global data manager instance
window.dataManager = new DataManager();

// Export functions for global use
window.exportData = () => {
  dataManager.loadFromStorage();
  dataManager.exportData();
};

window.importData = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const result = await dataManager.importData(file);
        alert(result.message);
        if (result.success) {
          // Refresh the display
          if (typeof updateDisplay === "function") {
            updateDisplay();
          }
        }
      } catch (error) {
        alert(error.message);
      }
    }
  };

  input.click();
};

window.loadSampleData = () => {
  if (
    confirm("This will replace all current data with sample data. Continue?")
  ) {
    dataManager.loadSampleData();
    if (typeof updateDisplay === "function") {
      updateDisplay();
    }
    alert("Sample data loaded successfully!");
  }
};

window.clearAllData = () => {
  if (confirm("This will permanently delete all data. Are you sure?")) {
    dataManager.clearData();
    if (typeof updateDisplay === "function") {
      updateDisplay();
    }
    alert("All data cleared!");
  }
};

window.createBackup = () => {
  dataManager.loadFromStorage();
  dataManager.createBackup();
  alert("Backup created successfully!");
};

window.restoreBackup = () => {
  if (confirm("This will restore data from the last backup. Continue?")) {
    if (dataManager.restoreFromBackup()) {
      if (typeof updateDisplay === "function") {
        updateDisplay();
      }
      alert("Backup restored successfully!");
    } else {
      alert("No backup found!");
    }
  }
};
