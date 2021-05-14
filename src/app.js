'use strict';

import '@babel/polyfill';
import 'bootstrap';

import { SLOT_TYPES } from './slotTypes';
import { addOwnedItem, removeOwnedItem, isItemOwned, loadOwnedItems } from './ownedItems';
import fashionReportData from './data/master.json';

const NO_RESULTS = '<div class=\'resultHeader\'>No Results</div>';
const SLOTS = [
    'slot1',
    'slot2',
    'slot3',
    'slot4'
];

init();

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

$('#showLatestButton').on('click', function() {
    let latestReport = getLatestReport();

    if (latestReport) {
        resetHintSearchForm();

        $.each(SLOTS, function (slotIndex, slotValue) {
            const reportSlot = latestReport.slots[slotIndex];

            if (reportSlot) {
                $(`#${slotValue}Type`).val(reportSlot.type);
                $(`#${slotValue}Hint`).val(reportSlot.hint);
                $(`#${slotValue}Type`).trigger('change');
            }
        });
    }
});

$('#resetSlotsButton').on('click', function () {
    resetHintSearchForm();
});

$('#itemSearchButton').on('click', function() {
    const itemName = $('#itemName').val();

    searchItems(itemName);
});

function init() {
    loadOwnedItems();
    
    let latestReport = getLatestReport();

    if (latestReport) {
        $('#latestData').html(`Week ${latestReport.week} for ${latestReport.date}`);
    } else {
        $('#latestData').html('ERROR');
    }

    const offsets = [-2, -3, 3, 2, 1, 0, -1];
    const today = new Date();
    let currentWeekDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    currentWeekDate.setDate(currentWeekDate.getDate() + offsets[currentWeekDate.getDay()]);

    const firstWeekNumber = fashionReportData.reports[0].week;
    const firstWeekDateParts = fashionReportData.reports[0].date.split('-');
    const firstWeekDate = new Date(parseInt(firstWeekDateParts[0], 10), parseInt(firstWeekDateParts[1], 10) - 1, parseInt(firstWeekDateParts[2], 10));
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const numberOfDaysSince = Math.ceil((currentWeekDate - firstWeekDate) / millisecondsPerDay);
    const numberOfWeeksSince = Math.ceil(numberOfDaysSince / 7);
    const currentWeek = firstWeekNumber + numberOfWeeksSince;

    $('#currentWeek').html(`Week ${currentWeek} for ${currentWeekDate.getFullYear()}-${formatNumberForDate(currentWeekDate.getMonth() + 1)}-${formatNumberForDate(currentWeekDate.getDate())}`);
}

function formatNumberForDate(value) {
    if (value > 9) {
        return value.toString();
    }
    
    return '0' + value;
}

function getLatestReport() {
    let latestReport = null;

    for (let index = fashionReportData.reports.length - 1; index > -1; index--) {
        const report = fashionReportData.reports[index];

        if (report.theme && report.slots && report.slots.length == 4) {
            if (!latestReport || report.week > latestReport.week) {
                latestReport = report;
            }
        }
    }

    return latestReport;
}

function resetHintSearchForm() {
    $.each(SLOTS, function (slotIndex, slotValue) {
        $(`#${slotValue}Type`).val(SLOT_TYPES[0]);
        $(`#${slotValue}Hint`).val('');
        $(`#${slotValue}Type`).trigger('change');
    });
}

function searchItems(itemName) {
    const matchedSlots = new Map();
    const matchedReports = [];

    if (itemName && itemName.length > 1) {
        itemName = itemName.toLowerCase();
        
        // Find all of the slots that have the item.
        for (let slotIndex = 0; slotIndex < fashionReportData.slots.length; slotIndex++) {
            const slot = fashionReportData.slots[slotIndex];

            for (let itemIndex = 0; itemIndex < slot.items.length; itemIndex++) {
                const item = slot.items[itemIndex];

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

    // Sort the reports by order of the week they were.
    matchedReports.sort(function(x, y) {
        if (x.week < y.week) {
            return -1;
        }

        if (x.week > y.week) {
            return 1;
        }

        return 0;
    });

    const uniqueItems = [];

    // Get unique list of all of the matched items.
    matchedSlots.forEach(function(value, key, map) {
        value.forEach(function(item) {
            if (!uniqueItems.includes(item)) {
                uniqueItems.push(item);
            }
        });
    });

    let allItems = '';

    if (uniqueItems.length) {
        uniqueItems.sort();
        uniqueItems.forEach(function(item) {
            allItems += `<li>${item}</li>`;
        });

        allItems = `<ul>${allItems}</ul>`;
    }

    $('#itemSearchResults').html(allItems || NO_RESULTS);

    let allReports = '';

    // Get a list of matched reports.
    matchedReports.forEach(function(report) {
        // Find the slots that were matched.
        const intermediateReportResults = [];

        report.slots.forEach(function(slot) {
            matchedSlots.forEach(function (value, key, map) {
                if (key.type === slot.type && key.hint.toLowerCase() === slot.hint.toLowerCase()) {
                    intermediateReportResults.push({ slot, report, items: key.items });
                }
            });
        });

        if (intermediateReportResults.length) {
            if (allReports) {
                allReports += '<p></p>';
            }

            intermediateReportResults.forEach(function(result) {
                allReports += `Week ${result.report.week} - ${result.report.date}<br />`;
                allReports += `${result.slot.type} - ${result.slot.hint}<br />`;
                allReports += '<ul>';

                result.items.forEach(function(item) {
                    // Check to see if the item was part of the list,
                    // and if it was, make it stand out.
                    const className = uniqueItems.includes(item.name) ? 'highlightedItem' : '';

                    allReports += `<li class='${className}'>${item.name}</li>`;
                });

                allReports += '</ul>';
            });
        }
    });

    $('#reportSearchResults').html(allReports || NO_RESULTS);
}

function searchHints(type, hint, target) {
    if (type && hint) {
        if (type === 'All') {
            type = '';
        }

        const items = getItems(type, hint);

        target.html(items.allItems || NO_RESULTS);

        if (items.ids) {
            items.ids.forEach(function (id) {
                const element = $(`#${id}`);
                
                // Support selecting and unselecting owned items.
                $(element).on('click', function () {
                    const isChecked = element.is(':checked');

                    if (isChecked) {
                        addOwnedItem(id);
                    } else {
                        removeOwnedItem(id);
                    }
                });
            });
        }
    } else {
        target.html('');
    }
}

function getItems(type, hint) {
    let allItems = '';
    let ids = [];

    if (hint && hint.length > 1) {
        for (let index = 0; index < fashionReportData.slots.length; index++) {
            const slot = fashionReportData.slots[index];

            if ((slot.type === type || !type) && slot.hint.toLowerCase().includes(hint.toLowerCase())) {
                let items = '';
                let header = slot.hint;

                if (!type) {
                    header += ` (${slot.type})`;
                }

                for (let itemIndex = 0; itemIndex < slot.items.length; itemIndex++) {
                    const item = slot.items[itemIndex].name;
                    const id = `item${makeId(item)}`;
                    const checked = isItemOwned(id) ? ' checked' : '';

                    ids.push(id)
                    items += `<li><input type='checkbox' id='${id}' class='itemCheckbox'${checked}>${slot.items[itemIndex].name}</input></li>`;
                }

                if (allItems) {
                    allItems += '<p></p>';
                }

                allItems += `<div class='resultHeader'>${header}</div><div class='resultItems'><ul>${items}</ul></div>`;
            }
        }
    }

    return { ids, allItems };
}

function makeId(value) {
    return value.replace(/[\'\"\s/]/gi, '');
}