'use strict';

import '@babel/polyfill';
import 'bootstrap';

import { SLOT_TYPES } from './slotTypes';
import fashionReportData from './data/master-clean.json';

const SLOTS = [
    'slot1',
    'slot2',
    'slot3',
    'slot4'
];

$.each(SLOT_TYPES, function(typeIndex, typeValue) {
    $.each(SLOTS, function(slotIndex, slotValue) {
        $(`#${slotValue}Type`).append($('<option/>', {
            value: typeValue,
            text: typeValue
        }));
    });
});

$.each(SLOTS, function (slotIndex, slotValue) {
    $(`#${slotValue}Type`).on('change', function() {
        const type = $(`#${slotValue}Type`).val();
        const hint = $(`#${slotValue}Hint`).val();
        const target = $(`#${slotValue}Results`);

        searchHints(type, hint, target);
    });

    $(`#${slotValue}Hint`).on('keyup', function() {
        const type = $(`#${slotValue}Type`).val();
        const hint = $(`#${slotValue}Hint`).val();
        const target = $(`#${slotValue}Results`);

        searchHints(type, hint, target);
    });
});

$('#itemSearchButton').on('click', function() {
    const itemName = $('#itemName').val();

    searchItems(itemName);
});

function searchItems(itemName) {
    const matchedSlots = new Map();
    const matchedReports = [];

    if (itemName && itemName.length > 1) {
        // Find all of the slots that have 
        for (let slotIndex = 0; slotIndex < fashionReportData.slots.length; slotIndex++) {
            const slot = fashionReportData.slots[slotIndex];

            for (let itemIndex = 0; itemIndex < slot.items.length; itemIndex++) {
                var item = slot.items[itemIndex];

                if (item.name.toLowerCase().includes(itemName)) {
                    if (!matchedSlots.has(slot)) {
                        matchedSlots.set(slot, []);
                    }

                    matchedSlots.get(slot).push(item.name);
                }
            }
        }
    }

    matchedSlots.forEach(function(value, key, map) {
        // Find the reports that link to each slot.
        for (let reportIndex = 0; reportIndex < fashionReportData.reports.length; reportIndex++) {
            const report = fashionReportData.reports[reportIndex];

            for (let slotIndex = 0; slotIndex < report.slots.length; slotIndex++) {
                const slot = report.slots[slotIndex];
                
                if (slot.type === key.type && slot.hint === key.hint) {
                    matchedReports.push(report);
                    continue;
                }
            }
        }
    });


    // TODO
    const temp = [];

    matchedSlots.forEach(function (value, key, map) {
        temp.push({ slot: key, items: value })
    });

    const tempString = `${JSON.stringify(matchedReports)}<br /><br />${JSON.stringify(temp)}`;

    $('#itemSearchResults').html(tempString);

    matchedReports.forEach(function(report) {

    });
}

function searchHints(type, hint, target) {
    if (type && hint) {
        if (type === 'All') {
            type = '';
        }

        const allItems = getItems(type, hint);

        target.html(allItems || '<div class=\'resultHeader\'>No Results</div>');
    } else {
        target.html('');
    }
}

function getItems(type, hint) {
    let allItems = '';

    if (hint && hint.length > 1) {
        for (let index = 0; index < fashionReportData.slots.length; index++) {
            const item = fashionReportData.slots[index];

            if ((item.type === type || !type) && item.hint.toLowerCase().includes(hint.toLowerCase())) {
                let items = '';
                let header = item.hint;

                if (!type) {
                    header += ` (${item.type})`;
                }

                for (let itemIndex = 0; itemIndex < item.items.length; itemIndex++) {
                    items += `<li>${item.items[itemIndex].name}</li>`;
                }

                if (allItems) {
                    allItems += '<p></p>';
                }

                allItems += `<div class='resultHeader'>${header}</div><div class='resultItems'><ul>${items}</ul></div>`;
            }
        }
    }

    return allItems;
}