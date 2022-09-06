'use strict'

// Break out any "Replica/XXX" items into their perspective items.

const fs = require('fs');
const MASTER_FILE = '../src/data/master.json';
const INDENT_SIZE = 4;

let rawMasterData = fs.readFileSync(MASTER_FILE);
let masterData = JSON.parse(rawMasterData);

masterData.slots.forEach(slot => {
    const itemsToExpand = [];

    slot.items.forEach(item => {
        if (item.name.startsWith('Replica/')) {
            itemsToExpand.push(item);
        }
    });

    itemsToExpand.forEach(item => {
        const index = slot.items.indexOf(item);

        if (index != -1) {
            slot.items.splice(index, 1);

            const item1 = item.name.substr(8);
            const item2 = 'Replica ' + item1;

            slot.items.push({ 'name': item1 });
            slot.items.push({ 'name': item2 });

            console.log(`Expanding ${item.name} to:`);
            console.log(`\t${item1}`);
            console.log(`\t${item2}`);

            slot.items.sort(function (x, y) {
                const xName = x.name.toString().replace(/\"/g, '');
                const yName = y.name.toString().replace(/\"/g, '');

                return xName.localeCompare(yName);
            });
        } else {
            console.log(`Unable to expand '${item.name}'`);
        }
    });
});

fs.writeFileSync(MASTER_FILE, JSON.stringify(masterData, null, INDENT_SIZE));