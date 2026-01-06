// Import TV Items from CSV
// This script imports TV items from the CSV file with stock quantity 1000

function importTVItems() {
    // CSV data from TV.csv
    const csvData = `SONIC TV ALL MODELS ,,,,,,,,,,,,
#,Item Name,SIZE,description - futures ,  PRICE   ,,,,,,,,
1,"TV 32"" F6000-SMT ",32,32 SMART FRAMELESS - SYSTEM ANDROID , $70.00 ,,,,,,,,
2,"TV 32""F6000 ATV  ",32,32 ATV - FRAMELESS , $60.00 ,,,,,,,,
3,"TV 32""D1700  normal",32,32 ATV - , $60.00 ,,,,,,,,
4,"TV 32""D1700SMT",32,32 SMART - SYSTEM ANDROID , $70.00 ,,,,,,,,
5,"TV 32""D22SMT/TG",32,32 SMART -DOUBLE  GLASS , $75.00 ,,,,,,,,
6,"TV 42""F4000SMT ANDROID 14",42,42 SMART -FRAMELESS-   -ANDROID 14 , $125.00 ,,,,,,,,
7,"TV 42""T6000SMT ANDROID 14",42,42 SMART -ANDROID 14 -FRAMELESS -DOUBLE GLASS, $130.00 ,,,,,,,,
8,"TV 43""LJ50 (S2+T2)",43,43 DTV - DIGITAL + SATELITE , $110.00 ,,,,,,,,
9,"TV 50""LJ40 ATV ",50,50 - ATV , $150.00 ,,,,,,,,
10,"TV 50""T8000SMT -TG SMART ",50,50- SMART DOUBLE GLASS -FRAMELESS -ANDROID, $190.00 ,,,,,,,,
11,TV 50F8000SMT - ,50,50- SMART -FRAMELESS -ANDROID, $180.00 ,,,,,,,,
12,TV 55''T8000SMT - SMART DOUBLE GLASS,55,55- SMART -FRAMELESS - DOUBLE GLASS -ANDROID, $230.00 ,,,,,,,,
13,"TV 55""F8000SMT ",55,55- SMART -FRAMELESS-ANDROID, $220.00 ,,,,,,,,
14,"TV 55""Q9000SMT-T2/S2  - CURVED",55,55-CURVED TV -SMART +DIGITAL +SATELITE +AIR MOUSE GIFT -ANDROID-, $240.00 ,,,,,,,,
15,TV 65'' Q9000-SMT T2S2 4K,65,65- CURVED TV-4K -SMART +DIGITAL +SATELITE +AIR MOUSE GIFT -ANDROID, $400.00 ,,,,,,,,
16,"TV 43"" SN43WFHD WEBOS ",43,43 - SMART -WebOS SYSTEM + MAGIC MOUSE REMOTE -2K , $150.00 ,,,,,,,,
21,"TV50"" SN50WUHD , WEBOS 4K,S2T2",50,50 - SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $245.00 ,,,,,,,,
17,"TV 55"" SN55WUHD 4K ",55,55- SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $275.00 ,,,,,,,,
18,"TV 65"" SN65WUHD 4K ",65,65 - SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $375.00 ,,,,,,,,
19,"TV 70"" QLED70UHD",70,70-QLED  SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $450.00 ,,,,,,,,
20,"TV 70"" TG70WUHD (Double Glass)",70,70-  Double Glass- SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $451.00 ,,,,,,,,
20,"TV 75"" QLED75UHD",75,75 -QLED  SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $545.00 ,,,,,,,,
20,"TV 85"" QLED85UHD",85,85 - QLED SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $845.00 ,,,,,,,,
21,"TV SN98""WUHD 4K SMART ",98,98 - SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -," $20,000.00 ",,,,,,,,`;

    // Parse CSV
    const lines = csvData.split('\n').filter(line => line.trim());
    const items = [];
    
    // Skip header rows (first 2 lines)
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (handle quoted fields)
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim()); // Add last field
        
        // Extract data (columns: #, Item Name, SIZE, description, PRICE)
        if (fields.length >= 5) {
            const itemNumber = fields[0];
            const itemName = fields[1].replace(/""/g, '"').trim();
            const size = fields[2].trim();
            const description = fields[3].trim();
            let priceStr = fields[4].trim();
            
            // Parse price (remove $, commas, and quotes)
            priceStr = priceStr.replace(/[\$,"]/g, '').trim();
            const price = parseFloat(priceStr) || 0;
            
            // Skip if no name or price
            if (!itemName || price === 0) continue;
            
            // Generate barcode
            const barcode = `TV${itemNumber.padStart(3, '0')}`;
            
            // Create item object
            const item = {
                barcode: barcode,
                name: itemName,
                description: `${size}" - ${description}`,
                category: 'TV',
                supplier: 'SONIC',
                purchasePrice: Math.round(price * 0.7 * 100) / 100, // Estimate 70% of retail as purchase price
                retailPrice: price,
                stockQuantity: 1000,
                minStockLevel: 10,
                itemType: 'product'
            };
            
            items.push(item);
        }
    }
    
    // Import items
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    // Load existing data
    if (typeof window.loadData === 'function') {
        window.loadData();
    }
    
    items.forEach(item => {
        try {
            // Check if item already exists
            const existingItems = window.getAllItems ? window.getAllItems() : [];
            const exists = existingItems.some(existing => 
                existing.barcode === item.barcode || existing.name === item.name
            );
            
            if (exists) {
                skipped++;
                console.log(`Skipped existing item: ${item.name}`);
            } else {
                // Add item
                if (window.addItem) {
                    window.addItem(item);
                    imported++;
                    console.log(`Imported: ${item.name} - ${window.formatCurrency ? window.formatCurrency(item.retailPrice) : '$' + item.retailPrice}`);
                } else {
                    errors++;
                    console.error('addItem function not available');
                }
            }
        } catch (error) {
            errors++;
            console.error(`Error importing ${item.name}:`, error);
        }
    });
    
    // Create inventory entries
    if (typeof window.createInventoryEntryForItem === 'function') {
        items.forEach(item => {
            try {
                window.createInventoryEntryForItem(item);
            } catch (error) {
                console.error(`Error creating inventory entry for ${item.name}:`, error);
            }
        });
    }
    
    // Show summary
    const message = `TV Items Import Complete!\n\nImported: ${imported}\nSkipped (already exist): ${skipped}\nErrors: ${errors}\n\nTotal items processed: ${items.length}`;
    
    if (window.showNotification) {
        window.showNotification(message, 'success');
    } else {
        alert(message);
    }
    
    console.log('Import Summary:', { imported, skipped, errors, total: items.length });
    
    // Refresh items display if on items page
    if (typeof window.loadItems === 'function') {
        window.loadItems();
    }
    if (typeof window.updateStatistics === 'function') {
        window.updateStatistics();
    }
    
    return { imported, skipped, errors, total: items.length };
}

// Auto-run if this script is loaded in browser
if (typeof window !== 'undefined') {
    // Export function to window
    window.importTVItems = importTVItems;
    
    // Auto-run on load (optional - comment out if you want manual execution)
    // importTVItems();
}

// For Node.js (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = importTVItems;
}

