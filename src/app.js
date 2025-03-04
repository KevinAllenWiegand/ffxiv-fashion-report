'use strict';

import '@babel/polyfill';
import 'bootstrap';

import { SLOT_TYPES } from './slotTypes';
import { addOwnedItem, removeOwnedItem, isItemOwned, loadOwnedItems, getAllOwnedItems, clearOwnedItems } from './ownedItems';
import fashionReportData from './data/master.json';

const NO_RESULTS = '<div class=\'resultHeader\'>No Results</div>';
const SLOTS = [
    'slot1',
    'slot2',
    'slot3',
    'slot4',
    'slot5'
];

let searchTimeoutObject;
let firstAvailableWeek;
let lastAvailableWeek;
let showingWeek;

// This is the equivalent of setting up a document.ready(), so we load the latest week when the DOM has finished loading.
$(function () {
    init();

    $.each(SLOT_TYPES, function (typeIndex, typeValue) {
        $.each(SLOTS, function (slotIndex, slotValue) {
            $(`#${slotValue}Type`).append($('<option/>', {
                value: typeValue,
                text: typeValue
            }));
        });
    });

    $.each(SLOTS, function (slotIndex, slotValue) {
        $(`#${slotValue}Type`).on('change', function () {
            const type = $(`#${slotValue}Type`).val();
            const hint = $(`#${slotValue}Hint`).val();
            const target = $(`#${slotValue}Results`);

            searchHints(type, hint, target);
        });

        $(`#${slotValue}Hint`).on('keyup', function () {
            const type = $(`#${slotValue}Type`).val();
            const hint = $(`#${slotValue}Hint`).val();
            const target = $(`#${slotValue}Results`);

            searchHints(type, hint, target);
        });
    });

    $('#showLatestButton').on('click', function () {
        showLatestReport();
    });

    $('#showPreviousWeekButton').on('click', function () {
        showPreviousWeekReport();
    });

    $('#showNextWeekButton').on('click', function () {
        showNextWeekReport();
    });

    $('#resetSlotsButton').on('click', function () {
        resetHintSearchForm();
    });

    $('#itemSearchButton').on('click', function () {
        const itemName = $('#itemName').val();

        searchItems(itemName);
    });

    $('#itemName').on('keyup', function () {
        if (searchTimeoutObject) {
            clearTimeout(searchTimeoutObject);
        }

        searchTimeoutObject = setTimeout(function () {
            $('#itemSearchButton').trigger('click');
        }, 500);
    });

    $('#backupButton').on('click', function () {
        const itemsArray = [];

        getAllOwnedItems().forEach(function(value, key, map) {
            itemsArray.push(key);
        });

        download('ffxiv-fashion-report-myitems.json', JSON.stringify(itemsArray));
    });

    $('#restoreButton').on('click', function () {
        const restoreFile = $('#restoreFile');

        if (!restoreFile[0] || !restoreFile[0].files[0]) {
            alert('You need to select a restore file first.');
        }

        const filename = restoreFile[0].files[0].name.toLowerCase();

        if (filename.length < 6 || !filename.endsWith('.json')) {
            alert('You need to select a valid json file.');
        }

        const fileReader = new FileReader();

        fileReader.onload = function(){
            const items = fileReader.result;

            if (items) {
                try {
                    var itemsArray = JSON.parse(items);

                    clearOwnedItems();

                    itemsArray.forEach(function (key) {
                        addOwnedItem(key);
                    });

                    loadMyItems();
                    $('#myItemsToRestore').val('');
                    showReport(showingWeek);
                    restoreFile.val('');
                } catch (error) {
                }
            }
        };

        fileReader.readAsText(restoreFile[0].files[0]);
    });

    showLatestReport();
    loadMyItems();
});

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function init() {
    loadOwnedItems();
    showLatestReport();

    const offsets = [-2, -3, 3, 2, 1, 0, -1];
    const today = new Date();
    const currentWeekDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    currentWeekDate.setDate(currentWeekDate.getDate() + offsets[currentWeekDate.getDay()]);

    const firstWeekNumber = fashionReportData.reports[0].week;
    const firstWeekDateParts = fashionReportData.reports[0].date.split('-');
    const firstWeekDate = new Date(parseInt(firstWeekDateParts[0], 10), parseInt(firstWeekDateParts[1], 10) - 1, parseInt(firstWeekDateParts[2], 10));
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const numberOfDaysSince = Math.ceil((currentWeekDate - firstWeekDate) / millisecondsPerDay);
    const numberOfWeeksSince = Math.ceil(numberOfDaysSince / 7);
    const currentWeek = firstWeekNumber + numberOfWeeksSince;

    firstAvailableWeek = firstWeekNumber;
    lastAvailableWeek = fashionReportData.reports[fashionReportData.reports.length - 1].week;

    if (currentWeek !== lastAvailableWeek) {
        $("#dataWarning").css("display", "block");
    }
}

function showLatestReport() {
    const latestReport = getLatestReport();

    if (latestReport) {
        showingWeek = latestReport.week;
    }

    showReport(latestReport.week);
}

function showReport(weekNumber) {
    let report = getReport(weekNumber);

    if (report) {
        resetHintSearchForm();

        $.each(SLOTS, function (slotIndex, slotValue) {
            const reportSlot = report.slots[slotIndex];

            if (reportSlot) {
                $(`#${slotValue}Type`).val(reportSlot.type);
                $(`#${slotValue}Hint`).val(reportSlot.hint);
                $(`#${slotValue}Type`).trigger('change');
            }
        });

        $('#weekTheme').html(`${report.theme} (Week ${report.week} for ${report.date})`);

        return true;
    }

    return false;
}

function showPreviousWeekReport() {
    if (showingWeek > firstAvailableWeek) {
        const effectiveWeek = showingWeek - 1;

        if (showReport(effectiveWeek)) {
            showingWeek--;
        }
    }
}

function showNextWeekReport() {
    if (showingWeek < lastAvailableWeek) {
        const effectiveWeek = showingWeek + 1;

        if (showReport(effectiveWeek)) {
            showingWeek++;
        }
    }
}

function getLatestReport() {
    let latestReport = null;

    for (let index = fashionReportData.reports.length - 1; index > -1; index--) {
        const report = fashionReportData.reports[index];

        if (report.theme && report.slots && (report.slots.length == 4 || report.slots.length == 5)) {
            if (!latestReport || report.week > latestReport.week) {
                latestReport = report;
            }
        }
    }

    return latestReport;
}

function getReport(weekNumber) {
    let retVal = null;

    for (let index = fashionReportData.reports.length - 1; index > -1; index--) {
        const report = fashionReportData.reports[index];

        if (report.theme && report.slots && (report.slots.length == 4 || report.slots.length == 5) && report.week === weekNumber) {
            retVal = report;
            break;
        }
    }

    return retVal;
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
    const matchedReportWeeks = new Set();
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
                    if (!matchedReportWeeks.has(report.week)) {
                        matchedReportWeeks.add(report.week);
                        matchedReports.push(report);
                    }
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
    let weekIds = new Map();

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
                let index = 0;
                let weekId = `week${result.report.week}_${index}`;

                while (weekIds.get(weekId) != null) {
                    index++;
                    weekId = `week${result.report.week}_${index}`;
                }

                weekIds.set(weekId, result.report.week);
                allReports += `Week ${result.report.week} - ${result.report.date}&nbsp;<span id='${weekId}' class='fas fa-search viewReport' title='View Report'></span><br />`;
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

    weekIds.forEach(function(value, key, map) {
        $(`#${key}`).on('click', function () {
            loadWeek(value);
        });
    });
}

function loadMyItems() {
    const owned = getAllOwnedItems();
    let items = [];
    let ownedItems = '<ul>'

    owned.forEach(function(value, key, map) {
        let found = false;

        for (let slotIndex = 0; slotIndex < fashionReportData.slots.length; slotIndex++) {
            const slot = fashionReportData.slots[slotIndex];

            for (let itemIndex = 0; itemIndex < slot.items.length; itemIndex++) {
                const item = slot.items[itemIndex];

                if (makeId(`item${item.name}`) === key) {
                    items.push(item.name);
                    found = true;
                    break;
                }
            }

            if (found) {
                break;
            }
        }
    });

    items.sort();
    items.forEach(function(item) {
        ownedItems += `<li>${item}</li>`;
    });

    ownedItems += '</ul>';

    $('#myItemsResults').html(ownedItems || NO_RESULTS);
}

function loadWeek(weekNumber) {
    resetHintSearchForm();

    const report = getReportForWeek(weekNumber);

    if (report && showReport(weekNumber)) {
        showingWeek = weekNumber;

        $('#navHome').trigger('click');
    }
}

function getReportForWeek(weekNumber) {
    for (let index = fashionReportData.reports.length - 1; index > -1; index--) {
        const report = fashionReportData.reports[index];

        if (report.week === weekNumber) {
            return report;
        }
    }

    return null;
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

                    loadMyItems();
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

            if ((slot.type === type || !type) && slot.items.length > 0 && slot.hint.toLowerCase().includes(hint.toLowerCase())) {
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
                    const searchQuery = encodeURIComponent(slot.items[itemIndex].name).replace(/[\']/gi, '%27');
                    const searchUri = 'https://na.finalfantasyxiv.com/lodestone/playguide/db/search/?q=' + searchQuery;
                    items += `<li><input type='checkbox' id='${id}' class='itemCheckbox'${checked}>${slot.items[itemIndex].name}</input><a href='${searchUri}' target='_blank' class='fas fa-search searchLodestone' title='Search in Lodestone'></a></li>`;
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
    return value.replace(/[\'\"\s/\(\)\.]/gi, '');
}