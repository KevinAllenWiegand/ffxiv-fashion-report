'use strict'

// Example:  node addslot head "hint" "item1" "item2"

// If a hint or item has a space or comma, wrap it in quotes.
// WARNING: CASE MATTERS WITH HINTS AND ITEMS.  The slot type does not matter, but the hints and items must be entered exactly how you want them saved.
// If a hint or item has quotes, use double ', if a hint or item has an apostrophe, use a single ':
//   head "Tip o' the Arhat" "Some ''New'' Item"

// Note that if a slot already exists with the specified hint, the items will be merged.

// Full Example:
//   node addslot head "A Knight For Helms" "Helm Of The Divine War" "Titanium Helm Of Fending"

const fs = require('fs');
const MASTER_FILE = '../src/data/master.json';
const INDENT_SIZE = 4;
const SLOT_TYPES = [
    'Head',
    'Body',
    'Hands',
    'Legs',
    'Feet',
    'Ear',
    'Neck',
    'Wrist',
    'Ring'
];

if (process.argv.length < 5) {
    let effectiveArgCount = process.argv.length - 2;

    if (effectiveArgCount < 0) {
        effectiveArgCount = 0;
    }

    // It's really 3+ arguments, the first 2 are from node.
    console.log(`Expected at least 3 arguments, but got ${effectiveArgCount}`);
    console.log('Usage:');
    console.log('node addweek "Theme" slot "Hint" slot "Hint" slot "Hint" slot "Hint"');
    console.log('\nNOTES:');
    console.log('If a hint has quotes, use double \', if a hint has an apostrophe, use a single \'.');
    console.log('If the theme or a hint has a space, wrap it in quotes.');
    return;
}

const args = process.argv.slice(2);
let slot = '';
let hint = '';
let items = [];

for (let index = 0; index < args.length; index++) {
    const effectiveArg = args[index].replace(/''/g, '\"');

    if (!slot) {
        const effectiveSlotType = validateSlotType(effectiveArg);

        if (effectiveSlotType.slot) {
            slot = effectiveSlotType.slot;
        } else {
            console.log(effectiveSlotType.error || `Unable to validate the slot type "${effectiveArg}".`);
            break;
        }
    } else if (!hint) {
        hint = effectiveArg;
    } else {
        items.push({ name: effectiveArg })
    }
}

if (!slot || !hint || items.length == 0) {
    console.log('There was an error parsing the arguments.  Could not determine either the slot, hint, or all items.');
    return;
}

let rawMasterData = fs.readFileSync(MASTER_FILE);
let masterData = JSON.parse(rawMasterData);
let existingSlot = null;

for (let index = 0; index < masterData.slots.length; index++) {
    const possibleExistingSlot = masterData.slots[index];
    const existingSlotType = possibleExistingSlot.type.toString();
    const existingSlotHint = possibleExistingSlot.hint.toString().toLowerCase();

    if (existingSlotType === slot && existingSlotHint === hint.toLowerCase()) {
        existingSlot = possibleExistingSlot;
        break;
    }
}

if (existingSlot) {
    console.log('Updating existing slot with the following information:');
} else {
    console.log('Adding new slot with the following information:');
}

console.log(`${slot} - ${hint}`);

items.forEach(item => {
    console.log(item.name);
});

if (existingSlot) {
    let addedItemCount = 0;

    console.log(`Item count prior to the merge is ${existingSlot.items.length}.`);

    items.forEach(item => {
        let itemExists = false;

        for (let index = 0; index < existingSlot.items.length; index++) {
            const existingItem = existingSlot.items[index];

            itemExists = existingItem.name.localeCompare(item.name) === 0;

            if (itemExists) {
                break;
            }
        }

        if (!itemExists) {
            addedItemCount++;
            existingSlot.items.push(item);
        }
    });

    if (addedItemCount) {
        console.log(`Added ${addedItemCount} items.`);
        console.log(`Item count after the merge is ${existingSlot.items.length}.`);
    
        existingSlot.items.sort(itemSorter);
    } else {
        console.log('No new items were added.');
        return;
    }
} else {
    console.log(`Slot count prior to the addition is ${masterData.slots.length}.`);
    items.sort(itemSorter);
    masterData.slots.push({
        type: slot,
        hint,
        items
    });

    // Sort the slots (By order of the "enum" [SLOT_TYPES.indexOf(slot)], and then by the hint)
    masterData.slots.sort(function (x, y) {
        const xType = SLOT_TYPES.indexOf(x.type);
        const yType = SLOT_TYPES.indexOf(y.type);

        if (xType < yType) {
            return -1;
        }

        if (xType > yType) {
            return 1;
        }

        const xHint = x.hint.toString().replace(/\"/g, '');
        const yHint = y.hint.toString().replace(/\"/g, '');

        return xHint.localeCompare(yHint);
    });

    console.log(`Slot count after the addition is ${masterData.slots.length}.`);
}

fs.writeFileSync(MASTER_FILE, JSON.stringify(masterData, null, INDENT_SIZE));

function itemSorter(x, y) {
    const xName = x.name.toString().replace(/\"/g, '');
    const yName = y.name.toString().replace(/\"/g, '');

    return xName.localeCompare(yName);
}

function validateSlotType(slotType) {
    const effectiveSlotType = slotType.substr(0, 1).toUpperCase() + slotType.substr(1);

    if (!SLOT_TYPES.includes(effectiveSlotType)) {
        return { error: `Invalid slot "${effectiveSlotType}".` };
    }

    return { slot: effectiveSlotType };
}