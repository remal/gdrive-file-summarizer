# gdrive-file-summarizer

Google Apps Script project that scans a Google Drive folder, summarizes each file's content
using an LLM, and writes the results to a Google Sheet, one row per file.

## Example

Point it at a Google Drive folder containing personal documents. Each file in the folder gets
analyzed and summarized, and all summaries are collected in a single spreadsheet, one row per
file.

## Design

One shared library serves every consuming Sheet. Each Sheet supplies its own folder, instructions,
and LLM settings, and owns the output rows.

```mermaid
sequenceDiagram
    participant T as "Trigger / Menu"
    box Spreadsheet logic
        participant S as "Sheet script"
        participant O as "Output rows"
    end
    box Library logic
        participant L as "Library"
        participant D as "Drive"
        participant G as "LLM"
    end

    T->>S: run()
    S->>O: read existing signatures
    O-->>S: known signatures by file ID
    S->>L: process(folderId, knownSignatures, instructions, llmConfig)
    L->>D: list files recursively
    D-->>L: file list

    loop each new/changed file
        L->>D: fetch raw file bytes
        D-->>L: file bytes
        L->>G: upload file
        G-->>L: file reference
        L->>G: summarize(fileRef, instructions)
        G-->>L: response
        L->>G: delete file
    end

    L-->>S: results (file, signature, response) per processed file
    loop each result
        S->>O: append new row (summary/status/signature)
    end
```

### Decisions

- **Shared library.** The core logic lives in an Apps Script library, developed with `clasp` and
  deployed as versioned releases. Each consuming Sheet pins a specific library version.
- **Consumer sheet.** Each Google Sheet has a bound script that holds its own config: the base
  Drive folder (traversed recursively), summarization instructions (which can vary by file
  mimetype), and LLM provider settings.
- **Credentials.** The LLM API key is stored in User Properties, never in a cell.
- **Triggers.** Both a time-driven trigger and a manual menu item call into the same entry point.
- **No direct spreadsheet access.** A library isn't a container-bound script, so it can't read or
  write the calling Sheet itself. The Sheet script reads its own hidden signature column and
  passes the known signatures into the library call, then takes the library's return value and
  writes it back.
- **Skip logic.** For each file, the library compares a configurable version signature (e.g.
  `lastModified`, a content hash, or another property) against the signatures passed in by the
  Sheet script, and only processes files that are new or changed.
- **LLM call.** The library uploads each file's raw bytes to the LLM provider, then asks the LLM
  to summarize by referencing the uploaded file rather than sending it inline. This relies on the
  provider's own multimodal handling rather than per-mimetype extraction in the library. The exact
  upload mechanism is provider-specific.
- **Cleanup.** Once the response comes back, the library deletes the uploaded file instead of
  leaving a copy of a personal document on the provider's servers.
- **Response handling.** The library returns the raw LLM response for each processed file. The
  Sheet's own bound script parses those responses and appends a new row with the summary,
  status/error, and signature columns, since that logic is specific to each Sheet.
- **Execution limits.** Not addressed for now: since only new or changed files are reprocessed on
  each run, Apps Script's 6-minute execution limit is not expected to be an issue in steady state.
