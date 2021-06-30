'use strict'

// Example:  node addweek "Theme" head "hint" body "hint" legs "hint" feet "hint"

// If the theme or a hint has a space or comma, wrap it in quotes.
// WARNING: CASE MATTERS WITH HINTS.  The slot type does not matter, but the hints must be entered exactly how you want them saved.
// If a hint has quotes, use double ', if a hint has an apostrophe, use a single ':
//   head "Tip 'o the Arhat"
//   legs "''Ala'' Carte"

// Full Example:
//   node addweek "This is the Theme" head "Tip 'o the Arhat" legs "''Ala'' Carte" hands "All in the Wrist" ring "Jewels of Black"

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

if (process.argv.length > 1) {
    const args = process.argv.slice(2);

    if (args.length != 9) {
        console.log(`Expected 9 arguments, but got ${args.length}`);
        console.log('Usage:');
        console.log('node addweek "Theme" slot "Hint" slot "Hint" slot "Hint" slot "Hint"');
        console.log('\nNOTES:');
        console.log('If a hint has quotes, use double \', if a hint has an apostrophe, use a single \'.');
        console.log('If the theme or a hint has a space, wrap it in quotes.');
        return;
    }

    let theme = '';
    let slots = [];

    for (let index = 0; index < args.length; index++) {
        const effectiveArg = args[index].replace(/''/g, '\"');

        if (theme === '') {
            theme = effectiveArg;
        } else {
            if (slots.length === 0 || slots[slots.length - 1].hint) {
                const effectiveSlotType = validateSlotType(effectiveArg);

                if (effectiveSlotType.slot) {
                    slots.push({ slot: effectiveSlotType.slot })
                } else {
                    console.log(effectiveSlotType.error || `Unable to validate the slot type "${effectiveArg}".`);
                    break;
                }
            } else {
                slots[slots.length - 1].hint = effectiveArg;
            }
        }
    }

    if (!theme || slots.length !== 4) {
        console.log('There was an error parsing the arguments.  Could not determine either the theme, or all 4 slots.');
        return;
    }

    for (let index = 0; index < slots.length; index++) {
        const slot = slots[index];

        if (!slot.slot || !slot.hint) {
            console.log('There was an error parsing the arguments.  One or more slot is missing the type or the hint.');
            return;
        }
    }

    console.log('Adding new week with the following information:');
    console.log(theme);

    slots.forEach(slot => {
        console.log(`${slot.slot}: ${slot.hint}`);
    });

    let rawMasterData = fs.readFileSync('../src/data/master.json');
    let masterData = JSON.parse(rawMasterData);
    const lastReportOriginal = getLastReport(masterData);

    if (lastReportOriginal.week === 0 || !lastReportOriginal.date) {
        console.log('Could not find any existing report data to add to.');
        return;
    }

    console.log(`Last report prior to addition is week ${lastReportOriginal.week} for ${lastReportOriginal.date}`);

    const newWeek = lastReportOriginal.week + 1;
    const dateParts = lastReportOriginal.date.split('-');
    const newDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

    newDate.setDate(newDate.getDate() + 7);

    const report = {
        week: newWeek,
        date: `${newDate.getFullYear()}-${formatNumberForDate(newDate.getMonth() + 1)}-${formatNumberForDate(newDate.getDate())}`,
        theme,
        slots: []
    };

    slots.forEach(slot => {
        report.slots.push({ slot: slot.slot, hint: slot.hint });
    });

    masterData.reports.push(report);

    const lastReportNew = getLastReport(masterData);

    console.log(`Last report after addition is week ${lastReportNew.week} for ${lastReportNew.date}`);

    const newData = JSON.stringify(masterData, null, 2);
    fs.writeFileSync('../src/data/master-new.json', newData);
}

function formatNumberForDate(value) {
    if (value > 9) {
        return value.toString();
    }

    return '0' + value;
}

function getLastReport(data) {
    let week = 0;
    let date = '';

    for (var index = data.reports.length - 1; index >= 0; index--) {
        const report = data.reports[index];

        if (!date || report.week > week) {
            week = report.week;
            date = report.date;
        }
    }

    return {
        week,
        date
    };
}

function validateSlotType(slotType) {
    const effectiveSlotType = slotType.substr(0, 1).toUpperCase() + slotType.substr(1);

    if (!SLOT_TYPES.includes(effectiveSlotType)) {
        return { error: `Invalid slot "${effectiveSlotType}".` };
    }

    return { slot: effectiveSlotType };
}