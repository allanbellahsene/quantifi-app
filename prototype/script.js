// DOM Elements
const collapseBtn = document.querySelector(".collapse-btn");
const leftSection = document.querySelector(".left-section");
const rightSection = document.querySelector(".right-section");
const horizontalDivider = document.getElementById('horizontal-divider');
const lowerPanel = document.getElementById('lower-panel');
const collapseButton = document.getElementById('collapse-button');
const strategyTabs = document.getElementById('strategy-tabs');
const addStrategyTab = document.getElementById('add-strategy-tab');
const duplicateStrategyButton = document.getElementById('duplicate-strategy');
const deleteStrategyButton = document.getElementById('delete-strategy');
const runBacktestButton = document.getElementById('run-backtest');

// Global Variables
let isHorizontalResizing = false;
let strategyCounter = 1;
const strategies = {}; // To store strategy data

// Event Listeners
collapseBtn.addEventListener("click", toggleLeftSection);
horizontalDivider.addEventListener('mousedown', startHorizontalResize);
document.addEventListener('mousemove', handleHorizontalResize);
document.addEventListener('mouseup', stopHorizontalResize);
collapseButton.addEventListener('click', toggleLowerPanel);
runBacktestButton.addEventListener('click', runBacktest);
addStrategyTab.addEventListener('click', addNewStrategyTab);
duplicateStrategyButton.addEventListener('click', () => {
    const activeTab = document.querySelector('.strategy-tab.active');
    if (activeTab) {
        duplicateStrategy(activeTab);
    }
});
deleteStrategyButton.addEventListener('click', () => {
    const activeTab = document.querySelector('.strategy-tab.active');
    if (activeTab) {
        deleteStrategy(activeTab);
    }
});

// Initialize the first strategy
init();

// Functions

/**
 * Toggles the visibility of the left section
 */
function toggleLeftSection() {
    leftSection.classList.toggle("collapsed");
    collapseBtn.querySelector("i").classList.toggle("fa-angle-left");
    collapseBtn.querySelector("i").classList.toggle("fa-angle-right");
    rightSection.classList.toggle("expanded");
}

/**
 * Initiates the horizontal resizing process
 * @param {Event} e - The mouse event
 */
function startHorizontalResize(e) {
    if (e.target === collapseButton || e.target.parentElement === collapseButton) return;
    isHorizontalResizing = true;
    document.body.style.cursor = 'row-resize';
}

/**
 * Handles the horizontal resizing of the lower panel
 * @param {Event} e - The mouse event
 */
function handleHorizontalResize(e) {
    if (!isHorizontalResizing) return;
    let containerRect = document.body.getBoundingClientRect();
    let newHeight = containerRect.bottom - e.clientY - 15; // Adjust for divider height
    newHeight = Math.max(50, Math.min(newHeight, window.innerHeight - 100)); // Constrain height
    lowerPanel.style.height = newHeight + 'px';
}

/**
 * Stops the horizontal resizing process
 */
function stopHorizontalResize() {
    if (isHorizontalResizing) {
        isHorizontalResizing = false;
        document.body.style.cursor = 'default';
    }
}

/**
 * Toggles the collapse state of the lower panel
 */
function toggleLowerPanel() {
    lowerPanel.classList.toggle('collapsed');
    const icon = collapseButton.querySelector('i');
    icon.classList.toggle('fa-angle-double-up');
    icon.classList.toggle('fa-angle-double-down');

    // Toggle the expanded attribute on the right section
    const rightSection = document.querySelector('.right-section');
    const isExpanded = rightSection.getAttribute('data-expanded') === 'true';
    rightSection.setAttribute('data-expanded', !isExpanded);
}



/**
 * Runs the backtest with the current parameters
 */
function runBacktest() {
    const assetSymbol = document.getElementById('asset-symbol').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const fees = document.getElementById('fees').value;
    const slippage = document.getElementById('slippage').value;

    alert(`Backtest started with the following parameters:
Asset Symbol: ${assetSymbol}
Start Date: ${startDate}
End Date: ${endDate}
Fees: ${fees}%
Slippage: ${slippage}%`);

    // Simulate backtest logic
    console.log('Backtest parameters:', {
        assetSymbol,
        startDate,
        endDate,
        fees,
        slippage
    });

    // Simulate backtest completion
    setTimeout(() => {
        alert(`Backtest completed for ${assetSymbol} from ${startDate} to ${endDate}.`);
        // TODO: Display backtest results in the lower panel
    }, 2000);
}

/**
 * Adds a new strategy tab
 */
function addNewStrategyTab() {
    strategyCounter++;
    const strategyId = 'strategy-' + strategyCounter;
    const strategyName = 'Strategy ' + strategyCounter;

    // Create new strategy data
    strategies[strategyId] = {
        name: strategyName,
        flowCards: [
            {
                type: 'entry-rules',
                title: 'Entry Rules',
                content: `<p><span class="highlight">Indicator A</span> crosses above <span class="highlight">Indicator B</span></p>`
            },
            {
                type: 'exit-rules',
                title: 'Exit Rules',
                content: `<p><span class="highlight">Price</span> drops below <span class="highlight">Moving Average</span></p>`
            },
            {
                type: 'position-sizing',
                title: 'Position Sizing',
                content: `<p><span class="highlight">Fixed Size:</span> 10%</p>`
            },
            {
                type: 'strategy-allocation',
                title: 'Strategy Allocation',
                content: `<p><span class="highlight">Fixed Size:</span> 100%</p>`
            },
            {
                type: 'risk-management',
                title: 'Risk Management',
                content: `<p><span class="highlight">Stop Loss:</span> -20%</p><p><span class="highlight">Take Profit:</span> 10%</p>`
            }
        ]
    };

    // Create new tab
    const newTab = document.createElement('div');
    newTab.classList.add('strategy-tab');
    newTab.dataset.strategyId = strategyId;
    newTab.innerHTML = `
        <span class="tab-name">${strategyName}</span>
        <button class="tab-dropdown-btn"><i class="fas fa-chevron-down"></i></button>
        <div class="tab-dropdown-menu">
            <button class="tab-dropdown-item" data-action="rename">Rename</button>
            <button class="tab-dropdown-item" data-action="duplicate">Duplicate</button>
            <button class="tab-dropdown-item" data-action="delete">Delete</button>
        </div>
    `;

    // Insert before the add button
    strategyTabs.insertBefore(newTab, addStrategyTab);

    // Remove 'active' class from existing tabs and set to new tab
    document.querySelectorAll('.strategy-tab').forEach(tab => tab.classList.remove('active'));
    newTab.classList.add('active');

    // Attach event listeners to the new tab
    attachTabEventListeners(newTab);

    // Load the new strategy data
    loadStrategy(strategyId);
}

/**
 * Duplicates the current active strategy
 */
function duplicateStrategy(strategyTab) {
    const strategyId = strategyTab.dataset.strategyId;
    const strategyData = strategies[strategyId];

    // Create new strategy
    strategyCounter++;
    const newStrategyId = 'strategy-' + strategyCounter;
    const newStrategyName = strategyData.name + ' Copy';

    strategies[newStrategyId] = JSON.parse(JSON.stringify(strategyData));
    strategies[newStrategyId].name = newStrategyName;

    // Create new tab
    const newTab = strategyTab.cloneNode(true);
    newTab.dataset.strategyId = newStrategyId;
    newTab.querySelector('.tab-name').textContent = newStrategyName;

    // Insert before the add button
    strategyTabs.insertBefore(newTab, addStrategyTab);

    // Remove 'active' class from existing tabs and set to new tab
    document.querySelectorAll('.strategy-tab').forEach(tab => tab.classList.remove('active'));
    newTab.classList.add('active');

    // Attach event listeners to the new tab
    attachTabEventListeners(newTab);

    // Load the new strategy data
    loadStrategy(newStrategyId);
}

/**
 * Deletes the specified strategy
 */
function deleteStrategy(strategyTab) {
    if (strategyTabs.children.length > 2) { // At least one strategy tab must remain
        const confirmDelete = confirm('Are you sure you want to delete this strategy?');
        if (confirmDelete) {
            const strategyId = strategyTab.dataset.strategyId;

            // Remove strategy data
            delete strategies[strategyId];

            // Remove the tab
            strategyTab.remove();

            // Activate the first available strategy tab
            const firstTab = strategyTabs.querySelector('.strategy-tab:not(.strategy-tab-add)');
            if (firstTab) {
                firstTab.classList.add('active');
                loadStrategy(firstTab.dataset.strategyId);
            }
        }
    } else {
        alert('Cannot delete the last strategy.');
    }
}

/**
 * Attaches event listeners to a strategy tab
 * @param {Element} tab - The strategy tab element
 */
function attachTabEventListeners(tab) {
    // Handle tab click to activate
    tab.addEventListener('click', function(event) {
        if (!event.target.classList.contains('tab-dropdown-btn') && !event.target.closest('.tab-dropdown-menu')) {
            document.querySelectorAll('.strategy-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadStrategy(tab.dataset.strategyId);
        }
    });

    // Dropdown button
    const dropdownBtn = tab.querySelector('.tab-dropdown-btn');
    dropdownBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        closeAllDropdowns();
        tab.classList.toggle('dropdown-open');
    });

    // Dropdown items
    const dropdownItems = tab.querySelectorAll('.tab-dropdown-item');
    dropdownItems.forEach(function(item) {
        item.addEventListener('click', function(event) {
            event.stopPropagation();
            const action = this.getAttribute('data-action');
            if (action === 'rename') {
                renameStrategy(tab);
            } else if (action === 'duplicate') {
                duplicateStrategy(tab);
            } else if (action === 'delete') {
                deleteStrategy(tab);
            }
            tab.classList.remove('dropdown-open');
        });
    });
}

/**
 * Closes all open dropdown menus in strategy tabs
 */
function closeAllDropdowns() {
    document.querySelectorAll('.strategy-tab.dropdown-open').forEach(function(tab) {
        tab.classList.remove('dropdown-open');
    });
}

// Close dropdowns when clicking outside
document.addEventListener('click', function() {
    closeAllDropdowns();
});

/**
 * Renames the specified strategy
 * @param {Element} strategyTab - The strategy tab element
 */
function renameStrategy(strategyTab) {
    const strategyId = strategyTab.dataset.strategyId;
    const currentName = strategyTab.querySelector('.tab-name').textContent;
    const newName = prompt('Enter new strategy name:', currentName);
    if (newName !== null && newName.trim() !== '') {
        strategyTab.querySelector('.tab-name').textContent = newName.trim();
        strategies[strategyId].name = newName.trim();
    }
}

/**
 * Loads the specified strategy
 * @param {String} strategyId - The ID of the strategy to load
 */
function loadStrategy(strategyId) {
    const strategyData = strategies[strategyId];
    console.log('Loading strategy:', strategyData);

    // Clear existing flow cards
    const flowCardsContainer = document.getElementById('flow-cards');
    flowCardsContainer.innerHTML = '';

    // Load flow cards from strategyData
    const flowCards = strategyData.flowCards || [];

    flowCards.forEach(cardData => {
        const flowCard = createFlowCard(cardData);
        flowCardsContainer.appendChild(flowCard);
    });
}

/**
 * Creates a flow card element from card data
 * @param {Object} cardData - The data for the flow card
 * @returns {Element} - The flow card element
 */
function createFlowCard(cardData) {
    const flowCard = document.createElement('div');
    flowCard.classList.add('flow-card');
    flowCard.setAttribute('data-card', cardData.type);

    flowCard.innerHTML = `
        <div class="card-header">
            <span class="card-title">${cardData.title}</span>
            <button class="card-parameter-btn"><i class="fas fa-cog"></i></button>
        </div>
        <div class="card-content">
            ${cardData.content}
        </div>
    `;

    // Add event listener for the parameter button if needed
    const parameterBtn = flowCard.querySelector('.card-parameter-btn');
    parameterBtn.addEventListener('click', function() {
        alert(`Configure parameters for ${cardData.title}`);
        // TODO: Implement parameter configuration
    });

    return flowCard;
}

/**
 * Initialize the application
 */
function init() {
    // Initialize the first strategy
    const initialStrategyId = 'strategy-1';
    strategies[initialStrategyId] = {
        name: 'Strategy 1',
        flowCards: [
            {
                type: 'entry-rules',
                title: 'Entry Rules',
                content: `<p><span class="highlight">Indicator A</span> crosses above <span class="highlight">Indicator B</span></p>`
            },
            {
                type: 'exit-rules',
                title: 'Exit Rules',
                content: `<p><span class="highlight">Price</span> drops below <span class="highlight">Moving Average</span></p>`
            },
            {
                type: 'position-sizing',
                title: 'Position Sizing',
                content: `<p><span class="highlight">Fixed Size:</span> 10%</p>`
            },
            {
                type: 'strategy-allocation',
                title: 'Strategy Allocation',
                content: `<p><span class="highlight">Fixed Size:</span> 100%</p>`
            },
            {
                type: 'risk-management',
                title: 'Risk Management',
                content: `<p><span class="highlight">Stop Loss:</span> -20%</p><p><span class="highlight">Take Profit:</span> 10%</p>`
            }
        ]
    };

    const initialTab = strategyTabs.querySelector('.strategy-tab');
    initialTab.dataset.strategyId = initialStrategyId;
    initialTab.querySelector('.tab-name').textContent = 'Strategy 1';

    // Attach event listeners to existing tab
    attachTabEventListeners(initialTab);

    // Load the initial strategy
    loadStrategy(initialStrategyId);
}
