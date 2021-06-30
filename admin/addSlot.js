'use strict'

// Example:  node addslot head "hint" "item1" "item2"

// If a hint or item has a space or comma, wrap it in quotes.
// WARNING: CASE MATTERS WITH HINTS AND ITEMS.  The slot type does not matter, but the hints and items must be entered exactly how you want them saved.
// If a hint or item has quotes, use double ', if a hint or item has an apostrophe, use a single ':
//   head "Tip o' the Arhat" "Some ''New'' Item"

// Full Example:
//   node addslot head "A Knight For Helms" "Helm Of The Divine War" "Titanium Helm Of Fending"

const fs = require('fs');
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

let rawMasterData = fs.readFileSync('../src/data/master.json');
let masterData = JSON.parse(rawMasterData);

for (let index = 0; index < masterData.slots.length; index++) {
    const existingSlot = masterData.slots[index];
    const existingSlotType = existingSlot.type.toString();
    const existingSlotHint = existingSlot.hint.toString().toLowerCase();

    if (existingSlotType === slot && existingSlotHint === hint.toLowerCase()) {
        console.log(`Cannot add a new "${slot}" slot with hint "${hint}" because it already exists.`);
        return;
    }
}

console.log('Adding new slot with the following information:');
console.log(`${slot} - ${hint}`);

items.forEach(item => {
    console.log(item.name);
});

console.log(`Slot count prior to addition is ${masterData.slots.length}`);

items.sort(function(x, y) {
    const xName = x.name.toString().replace(/\"/g, '');
    const yName = y.name.toString().replace(/\"/g, '');

    return xName.localeCompare(yName);
});

masterData.slots.push({
    type: slot,
    hint,
    items
});

// Sort the slots (By order of the "enum" [SLOT_TYPES.indexOf(slot)], and then by the hint)
masterData.slots.sort(function(x, y) {
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

console.log(`Slot count after the addition is ${masterData.slots.length}`);

const newData = JSON.stringify(masterData, null, 4);
fs.writeFileSync('../src/data/master.json', newData);

function validateSlotType(slotType) {
    const effectiveSlotType = slotType.substr(0, 1).toUpperCase() + slotType.substr(1);

    if (!SLOT_TYPES.includes(effectiveSlotType)) {
        return { error: `Invalid slot "${effectiveSlotType}".` };
    }

    return { slot: effectiveSlotType };
}