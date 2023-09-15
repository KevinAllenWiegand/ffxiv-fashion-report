'use strict';

const fs = require('fs');
const MASTER_FILE = '../src/data/master.json';

let rawMasterData = fs.readFileSync(MASTER_FILE);
let masterData = JSON.parse(rawMasterData);

checkUnreferencedSlots();
checkMissingSlots();

function checkUnreferencedSlots() {
    const unreferencedSlots = [];

    masterData.slots.forEach(slot => {
        let foundInReport = false;

        for (let reportIndex = 0; reportIndex < masterData.reports.length; reportIndex++) {
            const report = masterData.reports[reportIndex];

            for (let slotIndex = 0; slotIndex < report.slots.length; slotIndex++) {
                const reportSlot = report.slots[slotIndex];

                foundInReport = reportSlot.type === slot.type && reportSlot.hint == slot.hint;

                if (foundInReport) {
                    break;
                }
            }

            if (foundInReport) {
                break;
            }
        }

        if (!foundInReport) {
            unreferencedSlots.push(slot);
        }
    });

    console.log('Unreferenced Slots:')

    unreferencedSlots.forEach(slot => {
        console.log(`\t${slot.type}: ${slot.hint}`);
    });
}

function checkMissingSlots() {
    const missingSlots = [];

    masterData.reports.forEach(report => {
        let missing = null;

        report.slots.forEach(reportSlot => {
            let foundSlot = false;

            for (let index = 0; index < masterData.slots.length; index++) {
                const slot = masterData.slots[index];

                foundSlot = slot.type === reportSlot.type && slot.hint === reportSlot.hint;

                if (foundSlot) {
                    break;
                }
            }

            if (!foundSlot) {
                if (!missing) {
                    missing = { report, slots: [] };
                }

                missing.slots.push(reportSlot);
            }
        });

        if (missing) {
            missingSlots.push(missing);
        }
    });

    console.log('Missing Slots:')

    missingSlots.forEach(missing => {
        console.log(`\tWeek ${missing.report.week}: ${missing.report.theme}`);
        console.log('\tSlots:');

        missing.slots.forEach(slot => {
            console.log(`\t\t${slot.type}: ${slot.hint}`);
        });
    });
}