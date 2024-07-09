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
const MORSE_MAPPING = {
    '01': 'A', '1000': 'B', '1010': 'C', '100': 'D',
    '0': 'E', '0010': 'F', '110': 'G', '0000': 'H',
    '00': 'I', '0111': 'J', '101': 'K', '0100': 'L',
    '11': 'M', '10': 'N', '111': 'O', '0110': 'P',
    '1101': 'Q', '010': 'R', '000': 'S', '1': 'T',
    '001': 'U', '0001': 'V', '011': 'W', '1001': 'X',
    '1011': 'Y', '1100': 'Z',
};

let morseOrTrit = false; // false for Morse, true for Trit
let tritState = ['0', '0', '0'];
let morseState = '';
let startTime = {};
let timeoutIds = {};
let lastInputTime = null;
const comboDisplay = document.getElementById('tritSequence');
const translationDisplay = document.getElementById('translatedOutput');
const cpmDisplay = document.getElementById('cpm');
const keyButtons = {
    '1': document.getElementById('key1'),
    '2': document.getElementById('key2'),
    '3': document.getElementById('key3'),
};

const mappingTable = document.getElementById('mappingTable');


const translateCombination_called_dict = { 'call_times': [], 'num_calls': 0 };

const PRESS_THRESHOLD = 250; // For trit, press threshold from short to long click. For Morse, threshold from dot to dash.
const INPUT_TIMEOUT = 3000; // Time in milliseconds to wait for next input before translating

// Populate the mapping table, sorted by trit
buildMappingTable();
buildHeading();
const display = document.getElementById('key2').style.display;
console.log(display);

function buildHeading() {
    if (morseOrTrit) {
        document.getElementById('key2').style.display = '';
        document.getElementById('key3').style.display = '';
        document.getElementById('key1').innerText = '1';
        document.getElementsByClassName('table-title').item(0).innerText = 'Trit Alphabet';
        document.getElementById('description').innerHTML = `
        Press keys 1, 2, and 3 with short or long presses simultaneously to type. <br>To first learn, when attempting to
        type a letter, hold down the key(s) which need a 2 (long-click) and simultaneously click any which need a short
        click. Then let go of all keys. <br>The encodings were based on the relative frequencies of each letter in the
        english dictionary, and the ease of typing each 3trit combination, from easiest to most difficult.`;
        // change the color of the trit select button to green
        document.getElementById('trit-select').style.backgroundColor = 'green';
        document.getElementById('morse-select').style.backgroundColor = 'white';
    }
    else {
        document.getElementById('key2').style.display = 'none';
        document.getElementById('key3').style.display = 'none';
        document.getElementsByClassName('table-title').item(0).innerText = 'Morse Alphabet';
        document.getElementById('description').innerHTML = `
        Press key 1 with short or long presses to type. <br>To first learn, when attempting to type a letter, hold down the
        key which need a long-click. Then let go of the key. <br>The encodings were based on the morse alphabet.`;
        document.getElementById('morse-select').style.backgroundColor = 'green';
        document.getElementById('trit-select').style.backgroundColor = 'white';
    }
}

function buildMappingTable() {
    const sortedMapping = getSortedTritMapping(morseOrTrit ? TRIT_MAPPING : MORSE_MAPPING);
    if (!morseOrTrit) {
        // manually add the space character to the end of the morse mapping
        sortedMapping.push(['?', 'No Match']);
    }
    mappingTable.innerHTML = ''; // Empty the mapping table
    sortedMapping.forEach(([it, letter]) => {
        const cell = mappingTable.insertRow().insertCell(0);
        cell.innerText = `${letter} (${it})`;
    });
}

const toggleSwitch = document.getElementById('toggleSwitch');

toggleSwitch.addEventListener('change', () => {
    // Only allow switch when no text, to prevent confusion
    if ((translationDisplay.innerText.length > 0) || (!morseOrTrit && (startTime['1'] || lastInputTime))) {
        toggleSwitch.checked = !toggleSwitch.checked; // revert the switch back to its previous position
        return;
    }
    morseOrTrit = !morseOrTrit;
    // repopulate the mapping table with the new mapping
    buildMappingTable();
    buildHeading();
    if (morseOrTrit) {
        // reset the trit state
        tritState = ['0', '0', '0'];
        updateDisplay();
    }
    else {
        // reset the morse state
        morseState = '';
    }


});

document.addEventListener('keydown', (event) => {
    if (morseOrTrit) {
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
    }
    else {
        if (event.key === '1' && !startTime[event.key]) {
            startTime[event.key] = new Date().getTime(); // Record start time of key press
            keyButtons[event.key].classList.add('short-press');
            console.log(`Key ${event.key} down`);
        } else if (event.key === 'Backspace') {
            handleBackspace();
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (morseOrTrit) {
        if (event.key === '1' || event.key === '2' || event.key === '3') {
            clearTimeout(timeoutIds[event.key]); // Clear timeout to prevent switching to long-press
            const duration = new Date().getTime() - startTime[event.key]; // Calculate duration of key press

            const trit = determineTritState(duration); // Determine trit based on press duration
            const index = parseInt(event.key) - 1; // Map key to trit index
            tritState[index] = trit; // Update trit state
            keyButtons[event.key].classList.remove('short-press', 'long-press'); // Remove press class
            console.log(`Key ${event.key} up, duration: ${duration}, trit: ${trit}`);
            updateDisplay();
            startTime[event.key] = null;

            if (!startTime['1'] && !startTime['2'] && !startTime['3']) { // Check if all keys are released
                translateCombination(); // Translate trit combination to English
            }
        }
    }
    else {
        if (event.key === '1') {
            clearTimeout(timeoutIds[event.key]); // Clear timeout to prevent switching to long-press
            const duration = new Date().getTime() - startTime[event.key]; // Calculate duration of key press
            morseState += determineMorseState(duration); // Determine morse state based on press duration
            console.log(`Key ${event.key} up, duration: ${duration}`);
            console.log(`Morse state: ${morseState}`);
            startTime[event.key] = null;
            keyButtons[event.key].classList.remove('short-press', 'long-press'); // Remove press class
            updateDisplay();


            if (lastInputTime) {
                clearTimeout(lastInputTime);
            }
            lastInputTime = setTimeout(() => {
                translateCombination(); // Translate Morse combination to English
            }, INPUT_TIMEOUT);
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
function determineMorseState(duration) {
    if (duration < PRESS_THRESHOLD) {
        return '0'; // Dot
    } else {
        return '1'; // Dash
    }
}


function updateDisplay() {
    comboDisplay.innerText = morseOrTrit ? tritState.join('') : morseState; // Display current trit combination
}
function return_cpm() {
    //take the difference between the furthest call and the most recent call,
    //divide by 60,000, and multiply by the number of calls to get wpm 
    let delta = translateCombination_called_dict['call_times'][translateCombination_called_dict['call_times'].length - 1] - translateCombination_called_dict['call_times'][0];
    let num_calls = translateCombination_called_dict['num_calls'];
    let cpm = (num_calls / (delta / 60000));
    return cpm;
}
function update_cpm() {
    let curr_time = new Date().getTime();
    //    add an element to the call_times dict with the current time
    translateCombination_called_dict['call_times'].push(curr_time);
    //    check all the calls to see how many are within the last minute
    // Iterate over the array using a standard for loop, to safely remove items
    for (let i = translateCombination_called_dict.call_times.length - 1; i >= 0; i--) {
        if (curr_time - translateCombination_called_dict.call_times[i] > 10000) {
            translateCombination_called_dict.call_times.splice(i, 1);
        }
    }
    console.log(translateCombination_called_dict['call_times']);
    translateCombination_called_dict['num_calls'] = translateCombination_called_dict['call_times'].length;
}

function translateCombination() {
    if (morseOrTrit) {
        const tritCombination = tritState.join(''); // Join trit states to form combination

        const translation = TRIT_MAPPING[tritCombination] || '?'; // Translate trit combination to English
        console.log(`Trit combination: ${tritCombination}, translated to: ${translation}`);
        const outputDiv = document.getElementById('translatedOutput');
        outputDiv.innerText += translation; // Append translated character to output
        outputDiv.scrollTop = outputDiv.scrollHeight; // Scroll to bottom if necessary

        // Highlight the translated letter in the mapping table
        highlightTranslatedLetter(translation);
        update_cpm();
        cpmDisplay.innerText = `${Math.round(return_cpm())} cpm`;

        console.log(`Typing Speed: ${cpm} cpm`);
        tritState = ['0', '0', '0']; // Reset trit state
    }
    else {
        lastInputTime = null; // Reset input timeout
        const translation = MORSE_MAPPING[morseState] || '?'; // Translate morse combination to English
        console.log(`Morse combination: ${morseState}, translated to: ${translation}`);
        translationDisplay.innerText += translation; // Append translated character to output
        translationDisplay.scrollTop = translationDisplay.scrollHeight; // Scroll to bottom if necessary
        highlightTranslatedLetter(translation); // Highlight the translated letter in the mapping table
        morseState = ''; // Reset morse state
    }

}

function handleBackspace() {
    const currentText = translationDisplay.innerText;
    translationDisplay.innerText = currentText.slice(0, -1); // Remove last character from output
}

function highlightTranslatedLetter(translation) {
    const cells = mappingTable.getElementsByTagName('td');
    for (const cell of cells) {
        if (cell.innerText.includes(translation)) {
            cell.classList.add('highlight');
            setTimeout(() => {
                cell.classList.remove('highlight');
            }, 500);
        }
    }
}
