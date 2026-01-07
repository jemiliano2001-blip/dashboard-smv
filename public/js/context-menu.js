/**
 * Context Menu Module
 * Handles right-click context menu functionality
 */

const contextMenuState = {
    isOpen: false,
    targetIndex: null,
    targetType: null
};

/**
 * Shows the context menu at cursor position
 * @param {MouseEvent} event - Mouse event
 * @param {string} targetType - Type of target: 'order', 'section', 'empty'
 * @param {Object} targetData - Additional data about the target
 */
function showContextMenu(event, targetType, targetData) {
    event.preventDefault();
    event.stopPropagation();
    
    const menu = document.getElementById('contextMenu');
    if (!menu) return;
    
    // Store context
    contextMenuState.isOpen = true;
    contextMenuState.targetType = targetType;
    contextMenuState.targetIndex = targetData?.index ?? null;
    
    // Update menu items based on target type
    updateContextMenuItems(targetType, targetData);
    
    // Position menu at cursor
    positionContextMenu(menu, event.clientX, event.clientY);
    
    // Show menu with animation
    menu.classList.add('show');
    
    console.log(`📌 Context menu opened for ${targetType}`, targetData);
}

/**
 * Hides the context menu
 */
function hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (!menu) return;
    
    menu.classList.remove('show');
    
    contextMenuState.isOpen = false;
    contextMenuState.targetIndex = null;
    contextMenuState.targetType = null;
}

/**
 * Updates context menu items based on target type
 * @param {string} targetType - Type of target
 * @param {Object} targetData - Target data
 */
function updateContextMenuItems(targetType, targetData) {
    const menu = document.getElementById('contextMenu');
    if (!menu) return;
    
    // For now, all items are visible for order cards
    // In the future, we can show/hide items based on target type
    const items = menu.querySelectorAll('.context-menu-item');
    
    if (targetType === 'order') {
        items.forEach(item => {
            item.style.display = 'flex';
        });
    } else {
        // Hide all items for non-order targets for now
        items.forEach(item => {
            item.style.display = 'none';
        });
    }
}

/**
 * Positions the context menu at specified coordinates
 * Ensures menu stays within viewport boundaries
 * @param {HTMLElement} menu - Menu element
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function positionContextMenu(menu, x, y) {
    // Get menu dimensions
    menu.style.left = '0px';
    menu.style.top = '0px';
    menu.style.visibility = 'hidden';
    menu.style.display = 'block';
    
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    
    menu.style.display = '';
    menu.style.visibility = '';
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate position with boundary checks
    let left = x;
    let top = y;
    
    // Check right boundary
    if (left + menuWidth > viewportWidth) {
        left = viewportWidth - menuWidth - 10;
    }
    
    // Check bottom boundary
    if (top + menuHeight > viewportHeight) {
        top = viewportHeight - menuHeight - 10;
    }
    
    // Check left boundary
    if (left < 10) {
        left = 10;
    }
    
    // Check top boundary
    if (top < 10) {
        top = 10;
    }
    
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
}

/**
 * Handles context menu item click
 * @param {string} action - Action to perform
 */
function handleContextMenuAction(action) {
    const index = contextMenuState.targetIndex;
    
    if (index === null) {
        console.warn('⚠️ No target index for context menu action');
        hideContextMenu();
        return;
    }
    
    console.log(`🎯 Context menu action: ${action} for index ${index}`);
    
    switch (action) {
        case 'edit':
            if (typeof openEditModal === 'function') {
                openEditModal(index);
            }
            break;
            
        case 'duplicate':
            if (typeof duplicateOrder === 'function') {
                duplicateOrder(index);
            }
            break;
            
        case 'delete':
            if (typeof deleteOrderWithConfirmation === 'function') {
                deleteOrderWithConfirmation(index);
            }
            break;
            
        case 'move-top':
            moveOrderToPosition(index, 0);
            break;
            
        case 'move-bottom':
            moveOrderToPosition(index, state.orders.length - 1);
            break;
            
        default:
            console.warn(`⚠️ Unknown action: ${action}`);
    }
    
    hideContextMenu();
}

/**
 * Moves an order to a specific position
 * @param {number} fromIndex - Current index
 * @param {number} toIndex - Target index
 */
async function moveOrderToPosition(fromIndex, toIndex) {
    if (fromIndex === toIndex) {
        console.log('⚠️ Order already at target position');
        return;
    }
    
    // Use existing reorderOrders function if available
    if (typeof reorderOrders === 'function') {
        await reorderOrders(fromIndex, toIndex);
    } else {
        // Fallback: manually reorder
        const [movedOrder] = state.orders.splice(fromIndex, 1);
        state.orders.splice(toIndex, 0, movedOrder);
        
        if (typeof renderAllOrders === 'function') {
            renderAllOrders();
        }
        
        // Save if function exists
        if (typeof saveAllOrders === 'function') {
            try {
                await saveAllOrders(state.orders);
                console.log('✅ Order moved');
            } catch (error) {
                console.error('❌ Error saving order position:', error);
            }
        }
    }
}

/**
 * Determines what was right-clicked
 * @param {HTMLElement} element - Clicked element
 * @returns {Object} - { type: string, data: Object }
 */
function getClickTarget(element) {
    // Check if click is on an order row or its child
    const orderRow = element.closest('.order-row');
    
    if (orderRow) {
        const index = parseInt(orderRow.dataset.index, 10);
        return {
            type: 'order',
            data: { index }
        };
    }
    
    // Check if click is on a column
    const column = element.closest('#colLeft, #colRight');
    
    if (column) {
        return {
            type: 'section',
            data: { column: column.id }
        };
    }
    
    // Default to empty space
    return {
        type: 'empty',
        data: {}
    };
}

/**
 * Handles right-click events
 * @param {MouseEvent} event - Mouse event
 */
function handleRightClick(event) {
    // Get click target
    const target = getClickTarget(event.target);
    
    // Only show menu for order cards
    if (target.type === 'order') {
        showContextMenu(event, target.type, target.data);
    } else {
        // Hide menu if clicking elsewhere
        hideContextMenu();
    }
}

/**
 * Initializes context menu system
 */
function initializeContextMenu() {
    const menu = document.getElementById('contextMenu');
    
    if (!menu) {
        console.error('❌ Context menu element not found');
        return;
    }
    
    // Attach right-click listener to document
    document.addEventListener('contextmenu', handleRightClick);
    
    // Attach click listeners to menu items
    menu.addEventListener('click', (event) => {
        const item = event.target.closest('.context-menu-item');
        if (item) {
            const action = item.dataset.action;
            if (action) {
                handleContextMenuAction(action);
            }
        }
    });
    
    // Close menu on left click outside
    document.addEventListener('click', (event) => {
        if (contextMenuState.isOpen && !menu.contains(event.target)) {
            hideContextMenu();
        }
    });
    
    // Close menu on ESC key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && contextMenuState.isOpen) {
            hideContextMenu();
        }
    });
    
    // Close menu on scroll
    window.addEventListener('scroll', () => {
        if (contextMenuState.isOpen) {
            hideContextMenu();
        }
    }, true);
    
    // Close menu when columns scroll
    const colLeft = document.getElementById('colLeft');
    const colRight = document.getElementById('colRight');
    
    if (colLeft) {
        colLeft.addEventListener('scroll', () => {
            if (contextMenuState.isOpen) {
                hideContextMenu();
            }
        });
    }
    
    if (colRight) {
        colRight.addEventListener('scroll', () => {
            if (contextMenuState.isOpen) {
                hideContextMenu();
            }
        });
    }
    
    console.log('✅ Context menu initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContextMenu);
} else {
    initializeContextMenu();
}
