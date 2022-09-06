// Break out any "Replica/XXX" items into their perspective items.
// Break out any "Any " items into their perspective items.

const MASTER_FILE = '../src/data/master.json';
const INDENT_SIZE = 4;

let rawMasterData = fs.readFileSync(MASTER_FILE);
let masterData = JSON.parse(rawMasterData);

// TODO fs.writeFileSync(MASTER_FILE2, JSON.stringify(masterData, null, INDENT_SIZE));