local paint = require("sotto.paint")

return function(r)
  local g = {}
  paint(g, r, "SnacksPicker", {
    call = { "Prompt", "Selected", "GitBranchCurrent", "UndoCurrent" },
    voice = { "Cmd", "KeymapLhs", "GitBranch" },
    murmur = {
      "Special",
      "Spinner",
      "Time",
      "FileType",
      "InputSearch",
      "BufType",
      "BufFlags",
      "CmdBuiltin",
      "KeymapMode",
      "KeymapRhs",
      "DiagnosticCode",
      "ManPage",
      "UndoSaved",
      "Dir",
      "PathHidden",
      "AuEvent",
      "AuGroup",
      "AuPattern",
      "GitAuthor",
      "GitDate",
      "GitType",
      "GitScope",
      "GitIssue",
      "GitStatus",
    },
    breath = { "BufNr", "Idx", "Register", "ManSection", "Row", "Totals", "PathIgnored", "KeymapNowait", "GitCommit" },
    trace = { "Tree" },
    grown = { "LspEnabled", "GitStatusStaged" },
    nudge = { "GitStatusRenamed", "GitStatusCopied" },
    cue = { "GitStatusUntracked" },
    whisper = { "GitStatusIgnored" },
  })
  g.SnacksPickerMatch = r.title
  g.SnacksPickerCursorLine = { bg = r.near, bold = true }
  g.SnacksPickerListCursorLine = { link = "SnacksPickerCursorLine" }
  g.SnacksInputNormal = { link = "NormalFloat" }
  g.SnacksInputBorder = { link = "FloatBorder" }
  g.SnacksInputTitle = { link = "FloatTitle" }
  g.SnacksInputPrompt = { fg = r.call }
  g.SnacksInputIcon = { fg = r.call }
  g.SnacksFooterKey = { fg = r.murmur }
  g.SnacksFooterDesc = { fg = r.breath }
  g.SnacksWinKey = { fg = r.murmur }
  g.SnacksWinKeyDesc = { fg = r.breath }
  g.SnacksDim = { fg = r.breath }
  g.SnacksIndent = { fg = r.near }
  g.SnacksIndentScope = { fg = r.trace }
  g.SnacksDiffContext = { fg = r.voice }
  g.SnacksDiffHeader = { fg = r.murmur }
  g.SnacksDiffLabel = { fg = r.breath }
  g.SnacksDiffAddLineNr = { fg = r.grown, bg = r.tint_add }
  g.SnacksDiffDeleteLineNr = { fg = r.sharp, bg = r.tint_delete }
  g.SnacksDiffContextLineNr = { fg = r.breath }
  g.SnacksDiffConflictLineNr = { fg = r.flat, bg = r.tint_search }
  for _, kind in ipairs({ "Add", "Delete", "Context" }) do
    g["SnacksGhDiff" .. kind .. "LineNr"] = { link = "SnacksDiff" .. kind .. "LineNr" }
  end
  for _, level in ipairs({ "Error", "Warn", "Info", "Debug", "Trace" }) do
    g["SnacksNotifierBorder" .. level] = { link = "FloatBorder" }
    g["SnacksNotifierFooter" .. level] = { fg = r.breath }
  end
  for _, level in ipairs({ "Debug", "Trace" }) do
    g["SnacksNotifierIcon" .. level] = { fg = r.breath }
    g["SnacksNotifierTitle" .. level] = { fg = r.breath }
  end
  paint(g, r, "SnacksGh", { grown = { "Green" }, sharp = { "Red" }, aside = { "Purple" }, whisper = { "Gray" } })
  g.QuickFixFilename = { fg = r.murmur }
  g.QuickFixHeaderHard = { fg = r.trace }
  g.QuickFixHeaderSoft = { fg = r.trace }
  g.qfFileName = { link = "QuickFixFilename" }
  paint(g, r, "Oil", { grown = { "Create" }, flat = { "Change" }, cue = { "Copy" }, murmur = { "Socket" } })
  g.GrugFarResultsAddIndicator = { link = "Added" }
  g.GrugFarResultsChangeIndicator = { link = "Changed" }
  g.GrugFarResultsRemoveIndicator = { link = "Removed" }
  return g
end
