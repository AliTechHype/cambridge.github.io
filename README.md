# Distribution Management System

A comprehensive web-based distribution management system for medical supplies and equipment tracking.

## 🚀 New Features Added

### Sales Data Enhancements
- **Client Name**: Track which client made each purchase
- **Batch Number**: Track specific batch numbers for inventory management
- **Credits**: Record any credits given to clients
- **Expense**: Track additional expenses related to each sale
- **Profit/Loss Calculation**: Automatic calculation showing profit or loss for each sale

### Stock Data Enhancements
- **Total Investment**: The total amount invested in purchasing the stock
- **Additional Charges**: Any extra costs (transportation, handling, etc.)
- **Repurchase Field**: Track if the stock is a repurchase (Y/N)
- **Total Cost Calculation**: Investment + Additional Charges = Total Cost

## 💰 Business Logic Implementation

### Profit/Loss Calculation
The system now calculates profit/loss using the following formula:

```
Profit/Loss = (Selling Price - Total Cost Per Unit) × Quantity - Credits + Expenses
```

Where:
- **Total Cost Per Unit** = (Total Investment + Additional Charges) ÷ Quantity
- **Credits**: Amount given as credit to client (reduces profit)
- **Expenses**: Additional costs incurred (increases loss)

### Example Scenario
1. **Stock Purchase**: 20 cartons with ₹100 investment + ₹40 additional charges = ₹140 total cost
2. **Sale**: Sell at ₹180 per unit
3. **Calculation**: 
   - Total Cost Per Unit = ₹140 ÷ 20 = ₹7 per unit
   - Profit = (₹180 - ₹7) × 20 = ₹3,460 profit
   - If credits = ₹100 and expenses = ₹50
   - Final Profit = ₹3,460 - ₹100 + ₹50 = ₹3,410

### Repurchase Handling
- **Repurchase = "Y"**: Indicates this is a repurchase, may affect pricing strategy
- **Repurchase = "N"**: Initial purchase, standard pricing applies

## 📊 Dashboard Statistics

### Summary Cards
1. **Total Sales**: Sum of all sale amounts
2. **Total Profit**: Sum of all profitable sales
3. **Total Loss**: Sum of all loss-making sales (displayed prominently)
4. **Items Sold**: Total quantity sold
5. **Total Clients**: Unique client count
6. **Total Credits**: Sum of all credits given

### Visual Indicators
- 📈 Green color for profits
- 📉 Red color for losses
- 🔄 Icon for repurchase items
- 🔴🟡🟢 Stock level indicators

## 🎯 Key Benefits

1. **Accurate Profit Tracking**: Real-time profit/loss calculation for each sale
2. **Client Management**: Track sales by client for better relationship management
3. **Batch Tracking**: Maintain quality control with batch number tracking
4. **Expense Management**: Include all costs in profit calculations
5. **Repurchase Strategy**: Identify repurchase patterns for better pricing
6. **Loss Prevention**: Clear visibility of loss-making transactions

## 🔧 Technical Implementation

### Data Structure
```javascript
// Sales Data
{
  id: number,
  date: string,
  clientName: string,
  category: string,
  product: string,
  batchNumber: string,
  quantity: number,
  pricePerUnit: number,
  totalAmount: number,
  credits: number,
  expense: number,
  month: number,
  year: number
}

// Stock Data
{
  id: number,
  category: string,
  product: string,
  quantity: number,
  pricePerUnit: number,
  totalInvestment: number,
  additionalCharges: number,
  repurchase: "Y" | "N",
  totalValue: number
}
```

### Calculation Functions
- `calculateSaleProfitLoss(sale)`: Calculate profit/loss for individual sale
- `calculateProfit(sales)`: Sum all profits
- `calculateLoss(sales)`: Sum all losses

## 📱 User Interface

### Sales Table
- Displays all new fields with proper formatting
- Color-coded profit/loss indicators
- Batch number tracking
- Client information

### Stock Table
- Total investment and additional charges columns
- Repurchase indicator with icon
- Total cost calculation
- Stock level warnings

### Summary Dashboard
- 6 comprehensive summary cards
- Real-time statistics
- Visual indicators for quick insights

## 🚀 Getting Started

1. Open `index.html` in your browser
2. Add categories in Stock Management
3. Add stock items with investment details
4. Record sales with client information
5. Monitor profits/losses in real-time

## 📈 Business Insights

The system now provides:
- **Profit Margin Analysis**: See which products are most profitable
- **Client Profitability**: Track which clients generate most profit
- **Loss Identification**: Quickly identify loss-making transactions
- **Repurchase Patterns**: Understand repurchase impact on profits
- **Expense Tracking**: Include all costs in profit calculations

This enhanced system ensures accurate financial tracking and better business decision-making for your distribution business. 