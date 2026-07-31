const API_KEY_PROPERTY = 'GEMINI_API_KEY'
const TRIGGER_OWNER_PROPERTY = 'TRIGGER_OWNER_EMAIL'
const RUN_HANDLER = 'runSummarization'

function onOpen(): void {
    const menu = SpreadsheetApp.getUi().createMenu('Summarizer')
    if (hasApiKey_()) {
        menu.addItem('Run', RUN_HANDLER)
    } else {
        menu.addItem('Initialize', 'initialize')
    }
    menu.addToUi()
}

function initialize(): void {
    const ui = SpreadsheetApp.getUi()
    const response = ui.prompt('Gemini API key', 'Enter your Gemini API key:', ui.ButtonSet.OK_CANCEL)
    if (response.getSelectedButton() !== ui.Button.OK) {
        return
    }

    const apiKey = response.getResponseText().trim()
    if (!apiKey) {
        ui.alert('No API key entered.')
        return
    }

    PropertiesService.getUserProperties().setProperty(API_KEY_PROPERTY, apiKey)
    ensureScheduledTrigger_()
    ui.alert('Gemini API key saved. Reopen the Summarizer menu to run summarization.')
}

// Left empty pending decisions on where results are written and how known signatures are tracked.
function runSummarization(): void {
}

function hasApiKey_(): boolean {
    return !!PropertiesService.getUserProperties().getProperty(API_KEY_PROPERTY)
}

// getProjectTriggers() only ever sees the calling user's own triggers, so a shared Script
// Property tracks whether anyone has already created the trigger, not ScriptApp itself.
function ensureScheduledTrigger_(): void {
    const scriptProperties = PropertiesService.getScriptProperties()
    if (scriptProperties.getProperty(TRIGGER_OWNER_PROPERTY)) {
        return
    }

    ScriptApp.newTrigger(RUN_HANDLER).timeBased().everyHours(1).create()
    scriptProperties.setProperty(TRIGGER_OWNER_PROPERTY, Session.getActiveUser().getEmail())
}
