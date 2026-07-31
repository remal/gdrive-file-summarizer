import {hasApiKey_, initialize} from './Initialize'

export function runSummarization(): void {
    // TODO
}

export function onOpen(): void {
    const menu = SpreadsheetApp.getUi().createMenu('Summarizer')
    if (hasApiKey_()) {
        menu.addItem('Run', runSummarization.name)
    } else {
        menu.addItem('Initialize', initialize.name)
    }
    menu.addToUi()
}
