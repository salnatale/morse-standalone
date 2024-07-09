// new mapping from frequency encoding json 
const TRIT_MAPPING = {
    '001': 'E', '002': 'H', '010': 'T', '011': 'O',
    '012': 'W', '020': 'R', '021': 'F', '022': 'L', '100': 'A',
    '101': 'N', '102': 'G', '110': 'I', '111': 'S', '112': 'V',
    '120': 'P', '121': 'J', '122': 'Q', '200': 'D', '201': 'Y',
    '202': 'U', '210': 'B', '211': 'Z', '212': 'X', '220': 'C',
    '221': 'K', '222': 'M',
};
// keep old trit mapping for reference
const OG_TRIT_MAPPING = {
    '001': 'A', '002': 'B', '010': 'C', '011': 'D',
    '012': 'E', '020': 'F', '021': 'G', '022': 'H', '100': 'I',
    '101': 'J', '102': 'K', '110': 'L', '111': 'M', '112': 'N',
    '120': 'O', '121': 'P', '122': 'Q', '200': 'R', '201': 'S',
    '202': 'T', '210': 'U', '211': 'V', '212': 'W', '220': 'X',
    '221': 'Y', '222': 'Z',
};


const PRESS_THRESHOLD = 250;
let tritState = ['0', '0', '0'];
let startTime = {};
let timeoutIds = {};
const tritDisplay = document.getElementById('tritSequence');
const translationDisplay = document.getElementById('translatedOutput');
const cpmDisplay = document.getElementById('cpm');
const keyButtons = {
    '1': document.getElementById('key1'),
    '2': document.getElementById('key2'),
    '3': document.getElementById('key3'),
};
const translateTritCombination_called_dict = {'call_times':[], 'num_calls': 0};  




// Populate the mapping table, sorted by trit
const mappingTable = document.getElementById('mappingTable').getElementsByTagName('tbody')[0];

const sortedTritMapping = getSortedTritMapping(TRIT_MAPPING);

sortedTritMapping.forEach(([trit, letter]) => {
    const cell = mappingTable.insertRow().insertCell(0);
    cell.innerText = `${letter} (${trit})`;
});

document.addEventListener('keydown', (event) => {
    if ((event.key === '1' || event.key === '2' || event.key === '3') && !startTime[event.key]) {
        startTime[event.key] = new Date().getTime(); // Record start time of key press
        keyButtons[event.key].classList.add('short-press');
        timeoutIds[event.key] = setTimeout(() => {
            keyButtons[event.key].classList.remove('short-press');
            keyButtons[event.key].classList.add('long-press');
        }, PRESS_THRESHOLD);
        console.log(`Key ${event.key} down`);
    } else if (event.key === 'Backspace') {
        handleBackspace();
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === '1' || event.key === '2' || event.key === '3') {
        clearTimeout(timeoutIds[event.key]); // Clear timeout to prevent switching to long-press
        const duration = new Date().getTime() - startTime[event.key]; // Calculate duration of key press

        const trit = determineTritState(duration); // Determine trit based on press duration
        const index = parseInt(event.key) - 1; // Map key to trit index
        tritState[index] = trit; // Update trit state
        keyButtons[event.key].classList.remove('short-press', 'long-press');
        console.log(`Key ${event.key} up, duration: ${duration}, trit: ${trit}`);
        updateTritDisplay();
        startTime[event.key] = null;

        if (!startTime['1'] && !startTime['2'] && !startTime['3']) { // Check if all keys are released
            translateTritCombination(); // Translate trit combination to English
        }
    }
});

function getSortedTritMapping(mapping) {
    // Convert object to array of entries
    const entries = Object.entries(mapping);
    // Sort the array by the keys (first element of each entry). 
    entries.sort((a, b) => a[1].localeCompare(b[1]));
    
    return entries;
}

function determineTritState(duration) {
    if (duration < PRESS_THRESHOLD) {
        return '1'; // Short press
    } else {
        return '2'; // Long press
    }
}

function updateTritDisplay() {
    tritDisplay.innerText = tritState.join(''); // Display current trit combination
}
function return_cpm(){
    //take the difference between the furthest call and the most recent call,
    //divide by 60,000, and multiply by the number of calls to get wpm 
    let delta = translateTritCombination_called_dict['call_times'][translateTritCombination_called_dict['call_times'].length - 1] - translateTritCombination_called_dict['call_times'][0];
    let num_calls = translateTritCombination_called_dict['num_calls'];
    let cpm = (num_calls / (delta/60000));
    return cpm;
}
function update_cpm(){
    let curr_time = new Date().getTime();
//    add an element to the call_times dict with the current time
    translateTritCombination_called_dict['call_times'].push(curr_time);
//    check all the calls to see how many are within the last minute
    // Iterate over the array using a standard for loop, to safely remove items
    for (let i = translateTritCombination_called_dict.call_times.length - 1; i >= 0; i--) {
        if (curr_time - translateTritCombination_called_dict.call_times[i] > 10000) {
            translateTritCombination_called_dict.call_times.splice(i, 1);
        }
    }
    console.log(translateTritCombination_called_dict['call_times']);
    translateTritCombination_called_dict['num_calls'] = translateTritCombination_called_dict['call_times'].length;
}

function translateTritCombination() {
    const tritCombination = tritState.join(''); // Join trit states to form combination

    const translation = TRIT_MAPPING[tritCombination] || '?'; // Translate trit combination to English
    console.log(`Trit combination: ${tritCombination}, translated to: ${translation}`);
    const outputDiv = document.getElementById('translatedOutput');
    outputDiv.innerText += translation; // Append translated character to output
    outputDiv.scrollTop = outputDiv.scrollHeight; // Scroll to bottom if necessary

    // Highlight the translated letter in the mapping table
    highlightTranslatedLetter(tritCombination);
    update_cpm();
    cpmDisplay.innerText = `${Math.round(return_cpm())} cpm`;

    console.log(`Typing Speed: ${cpm} cpm`);
    tritState = ['0', '0', '0']; // Reset trit state
}

function handleBackspace() {
    const currentText = translationDisplay.innerText;
    translationDisplay.innerText = currentText.slice(0, -1); // Remove last character from output
}

function highlightTranslatedLetter(tritCombination) {
    const cells = mappingTable.getElementsByTagName('td');
        for (const cell of cells) {
            if (cell.innerText.includes(tritCombination)) {
                // remove highlight from all cells first
                console.log(cell.innerText);
                cell.classList.add('highlight');
                setTimeout(() => {
                    cell.classList.remove('highlight');
                }, 500);
            }
        }
    }

