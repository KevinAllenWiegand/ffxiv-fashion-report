const OWNED_ITEMS = new Map();
const KEY = 'ffxiv.fashionreport.items.owned';

function addOwnedItem(item) {
    if (!isItemOwned(item)) {
        OWNED_ITEMS.set(item, true);
        saveOwnedItems();
    }
}

function removeOwnedItem(item) {
    if (isItemOwned(item)) {
        OWNED_ITEMS.delete(item);
        saveOwnedItems();
    }
}

function isItemOwned(item) {
    return OWNED_ITEMS.has(item);
}

function saveOwnedItems() {
    const items = [];

    OWNED_ITEMS.forEach(function(value, key, map) {
        items.push(key);
    });

    window.localStorage.setItem(KEY, JSON.stringify(items));
}

function loadOwnedItems() {
    const rawKey = window.localStorage.getItem(KEY);

    if (rawKey) {
        const items = JSON.parse(rawKey);

        items.forEach(function(item) {
            OWNED_ITEMS.set(item, true);
        });
    }
}

export {
    addOwnedItem,
    removeOwnedItem,
    isItemOwned,
    loadOwnedItems
}