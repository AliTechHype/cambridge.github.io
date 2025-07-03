# Distribution Management System

A modern, responsive web application for managing medical distribution business with sales tracking, stock management, and profit calculation.

## Features

### 🏠 Home Page
- **Navigation Bar**: Clean navbar with MediDist logo and Stock Management button
- **Month Selector**: Dropdown to switch between months and view sales data
- **Add Sale Button**: Quick access to add new sales entries
- **Summary Cards**: Real-time display of total sales, profit, and items sold
- **Sales Table**: Detailed view of all sales for the selected month

### 📊 Sales Management
- Add new sales with date, category, product, quantity, and price
- View sales data filtered by month and year
- Edit and delete existing sales records
- Automatic calculation of total amounts
- Profit/loss calculation based on stock costs

### 📦 Stock Management
- **Category Management**: Add and remove product categories
- **Stock Items**: Add, edit, and delete stock items
- **Inventory Tracking**: Monitor quantities and total values
- **Cost Tracking**: Track purchase prices for profit calculation

### 💰 Financial Tracking
- Real-time profit/loss calculation
- Monthly sales summaries
- Stock value tracking
- Cost vs. selling price analysis

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser

### Installation
1. Download or clone the project files
2. Open `index.html` in your web browser
3. The application will load with sample data

### Data Storage
- All data is stored locally in your browser using localStorage
- Data persists between browser sessions
- Export/import functionality available for data backup

## Usage Guide

### Adding a Sale
1. Click the "Add Sale" button on the home page
2. Fill in the sale details:
   - Date of sale
   - Product category
   - Product name
   - Quantity sold
   - Price per unit
3. Click "Add Sale" to save

### Managing Stock
1. Click the "Stock Management" button in the top-right
2. **Adding Categories**:
   - Enter category name in the input field
   - Click "Add Category"
3. **Adding Stock Items**:
   - Click "Add Stock Item"
   - Fill in category, product name, quantity, and cost price
   - Click "Add Stock"

### Switching Months
- Use the month dropdown on the home page
- Sales data will automatically filter to show the selected month
- Summary cards update to reflect the selected month's data

### Data Management
- **Edit**: Click the edit button (pencil icon) next to any record
- **Delete**: Click the delete button (trash icon) to remove records
- **Export**: Use browser developer tools to export localStorage data
- **Import**: Replace localStorage data to import previous backups

## File Structure

```
distribution-management-system/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
├── data/
│   └── sample-data.json # Sample data structure
└── README.md           # This file
```

## Data Structure

### Sales Data
```json
{
  "id": 1,
  "date": "2024-01-15",
  "category": "Drips",
  "product": "Normal Saline",
  "quantity": 50,
  "pricePerUnit": 25.00,
  "totalAmount": 1250.00,
  "month": 1,
  "year": 2024
}
```

### Stock Data
```json
{
  "id": 1,
  "category": "Drips",
  "product": "Normal Saline",
  "quantity": 200,
  "pricePerUnit": 20.00,
  "totalValue": 4000.00
}
```

## Sample Categories
The system comes pre-loaded with these medical distribution categories:
- **Drips**: IV fluids and solutions
- **Medicines**: Pharmaceutical products
- **Equipment**: Medical supplies and equipment

## Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Local Storage
The application uses browser localStorage for data persistence:
- `salesData`: Array of all sales records
- `stockData`: Array of all stock items
- `categories`: Array of product categories

## Customization
- Modify `styles.css` to change the appearance
- Update `script.js` to add new features
- Edit sample data in `data/sample-data.json` for different initial data

## Support
For issues or questions:
1. Check browser console for error messages
2. Clear browser localStorage if data becomes corrupted
3. Ensure JavaScript is enabled in your browser

## Future Enhancements
- Multi-year data support
- Advanced reporting and analytics
- Customer management
- Supplier tracking
- Barcode scanning integration
- Mobile app version

---

**Note**: This is a frontend-only application. For production use with multiple users, consider adding a backend server and database. 