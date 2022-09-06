'use strict';

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

let rawMasterData = fs.readFileSync(MASTER_FILE);
let masterData = JSON.parse(rawMasterData);

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

masterData.slots.forEach(slot => {
    slot.items.sort(function (x, y) {
        const xName = x.name.toString().replace(/\"/g, '');
        const yName = y.name.toString().replace(/\"/g, '');

        return xName.localeCompare(yName);
    });
});

fs.writeFileSync(MASTER_FILE, JSON.stringify(masterData, null, INDENT_SIZE));