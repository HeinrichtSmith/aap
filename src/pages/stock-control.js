const inventoryData = {
    "C4": { 
        items: [
            { sku: "PNL-001", description: "Main Control Panel", qty: 42 }
        ], 
        status: "active" 
    },
    "F2": { 
        items: [
            { sku: "CBL-008A", description: "Power Cable Assembly", qty: 150 }
        ], 
        status: "active" 
    },
    "H3": { 
        items: [], 
        status: "empty" 
    },
    "A1": {
        items: [
            { sku: "RES-100K", description: "Resistor 100K Ohm", qty: 5000 },
            { sku: "RES-10K", description: "Resistor 10K Ohm", qty: 3500 }
        ],
        status: "active"
    },
    "B3": {
        items: [
            { sku: "CAP-100uF", description: "Capacitor 100uF", qty: 2000 }
        ],
        status: "active"
    },
    "D5": {
        items: [
            { sku: "LED-RED", description: "LED Red 5mm", qty: 10000 },
            { sku: "LED-GRN", description: "LED Green 5mm", qty: 8500 },
            { sku: "LED-BLU", description: "LED Blue 5mm", qty: 6000 }
        ],
        status: "active"
    },
    "IN": {
        items: [
            { sku: "PCB-MAIN", description: "Main PCB Board", qty: 25 },
            { sku: "ENC-ALU", description: "Aluminum Enclosure", qty: 30 }
        ],
        status: "active"
    },
    "PRO": {
        items: [
            { sku: "ASM-001", description: "Assembly Unit A", qty: 15 }
        ],
        status: "active"
    }
};

let selectedBin = null;

function initializeWarehouse() {
    const warehouseContainer = document.getElementById('warehouse-container');
    
    warehouseContainer.addEventListener('click', handleBinClick);
}

function handleBinClick(event) {
    const clickedElement = event.target;
    
    if (!clickedElement.hasAttribute('data-bin-id')) {
        return;
    }
    
    const prevSelected = document.querySelector('.bin.selected');
    if (prevSelected) {
        prevSelected.classList.remove('selected');
    }
    
    clickedElement.classList.add('selected');
    
    const binId = clickedElement.getAttribute('data-bin-id');
    selectedBin = binId;
    
    displayBinInfo(binId);
}

function displayBinInfo(binId) {
    const binData = inventoryData[binId];
    
    const binIdElement = document.getElementById('info-bin-id');
    const statusElement = document.getElementById('info-bin-status');
    const contentsElement = document.getElementById('info-bin-contents');
    
    binIdElement.textContent = `Bin: ${binId}`;
    
    if (!binData) {
        statusElement.innerHTML = '<span class="status-badge status-empty">Empty</span>';
        contentsElement.innerHTML = '<p class="empty-message">No inventory data available</p>';
        return;
    }
    
    const statusClass = binData.status === 'active' ? 'status-active' : 
                       binData.status === 'empty' ? 'status-empty' : 'status-inactive';
    statusElement.innerHTML = `<span class="status-badge ${statusClass}">${binData.status.toUpperCase()}</span>`;
    
    if (binData.items && binData.items.length > 0) {
        let tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Description</th>
                        <th>Qty</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        binData.items.forEach(item => {
            tableHtml += `
                <tr>
                    <td>${item.sku}</td>
                    <td>${item.description}</td>
                    <td>${item.qty}</td>
                </tr>
            `;
        });
        
        tableHtml += '</tbody></table>';
        contentsElement.innerHTML = tableHtml;
    } else {
        contentsElement.innerHTML = '<p class="empty-message">No items in this bin</p>';
    }
}

async function changeBinLocation(item, newBinId) {
    console.log(`Changing bin location for ${item} to ${newBinId}`);
    
    try {
        const response = await fetch('/api/bin/change-location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                item: item,
                newBinId: newBinId
            })
        });
        
        if (response.ok) {
            console.log('Bin location changed successfully');
            return await response.json();
        } else {
            console.error('Failed to change bin location');
            return null;
        }
    } catch (error) {
        console.error('Error changing bin location:', error);
        return null;
    }
}

async function transferStock(item, fromBin, toBin, quantity) {
    console.log(`Transferring ${quantity} of ${item} from ${fromBin} to ${toBin}`);
    
    try {
        const response = await fetch('/api/stock/transfer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                item: item,
                fromBin: fromBin,
                toBin: toBin,
                quantity: quantity
            })
        });
        
        if (response.ok) {
            console.log('Stock transferred successfully');
            return await response.json();
        } else {
            console.error('Failed to transfer stock');
            return null;
        }
    } catch (error) {
        console.error('Error transferring stock:', error);
        return null;
    }
}

async function runBinPutAway() {
    console.log('Running Bin Put-Away Worksheet...');
    
    try {
        const response = await fetch('/api/bin/put-away', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const suggestions = await response.json();
            console.log('Put-away suggestions:', suggestions);
            
            const itemsInTransit = [];
            Object.entries(inventoryData).forEach(([binId, data]) => {
                if (binId === 'IN' || binId === 'PRO') {
                    data.items.forEach(item => {
                        itemsInTransit.push({
                            ...item,
                            currentBin: binId
                        });
                    });
                }
            });
            
            const availableBins = [];
            Object.entries(inventoryData).forEach(([binId, data]) => {
                if (!['IN', 'OUT', 'PRO', 'SMT', 'ASS'].includes(binId)) {
                    if (!data || data.status === 'empty' || data.items.length === 0) {
                        availableBins.push(binId);
                    }
                }
            });
            
            return {
                itemsInTransit: itemsInTransit,
                availableBins: availableBins,
                suggestions: suggestions || []
            };
        } else {
            console.error('Failed to get put-away suggestions');
            return null;
        }
    } catch (error) {
        console.error('Error running put-away worksheet:', error);
        
        const mockSuggestions = {
            itemsInTransit: [],
            availableBins: [],
            suggestions: []
        };
        
        Object.entries(inventoryData).forEach(([binId, data]) => {
            if (binId === 'IN' || binId === 'PRO') {
                data.items.forEach(item => {
                    mockSuggestions.itemsInTransit.push({
                        ...item,
                        currentBin: binId
                    });
                });
            }
        });
        
        Object.entries(inventoryData).forEach(([binId, data]) => {
            if (!['IN', 'OUT', 'PRO', 'SMT', 'ASS'].includes(binId)) {
                if (!data || data.status === 'empty' || data.items.length === 0) {
                    mockSuggestions.availableBins.push(binId);
                }
            }
        });
        
        return mockSuggestions;
    }
}

document.addEventListener('DOMContentLoaded', initializeWarehouse);