import {hasApiKey_, initialize} from './Initialize'

function onOpen(): void {
    const menu = SpreadsheetApp.getUi().createMenu('Summarizer')
    if (hasApiKey_()) {
        menu.addItem('Run', runSummarization.name)
    } else {
        menu.addItem('Initialize', initialize.name)
    }
    menu.addToUi()
}

// Left empty pending decisions on where results are written and how known signatures are tracked.
export function runSummarization(): void {
}
