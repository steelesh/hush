local paint = require("hush.paint")

return function(r)
  local g = {}
  g.LazyH2 = r.title
  g.LazyButtonActive = r.current
  g.LazyItalic = { link = "Italic" }
  paint(g, r, "Lazy", {
    call = { "ProgressDone" },
    murmur = { "CommitType", "CommitScope", "CommitIssue", "Local" },
    breath = { "Commit" },
    whisper = {
      "ReasonCmd",
      "ReasonEvent",
      "ReasonFt",
      "ReasonImport",
      "ReasonKeys",
      "ReasonPlugin",
      "ReasonRequire",
      "ReasonRuntime",
      "ReasonSource",
      "ReasonStart",
    },
    trace = { "ProgressTodo" },
  })
  g.MasonHeader = { fg = r.pitch, bg = r.call, bold = true }
  g.MasonHeaderSecondary = { fg = r.pitch, bg = r.murmur, bold = true }
  g.MasonHeading = r.title
  g.MasonHighlight = { fg = r.call }
  g.MasonHighlightBlock = r.here
  g.MasonHighlightBlockBold = { link = "MasonHeader" }
  g.MasonHighlightSecondary = { fg = r.voice }
  g.MasonHighlightBlockSecondary = { fg = r.pitch, bg = r.murmur }
  g.MasonHighlightBlockBoldSecondary = { link = "MasonHeaderSecondary" }
  g.MasonMuted = { fg = r.whisper }
  g.MasonMutedBlock = { fg = r.voice, bg = r.near }
  g.MasonMutedBlockBold = { link = "MasonMutedBlock" }
  paint(g, r, "Neotest", {
    grown = { "Passed" },
    sharp = { "Failed" },
    flat = { "Running", "Watching", "Marked" },
    cue = { "Skipped" },
    voice = { "File", "Namespace" },
    form = { "Dir" },
    trace = { "Indent", "ExpandMarker" },
    call = { "Target" },
  })
  g.NeotestAdapterName = r.title
  g.NeotestWinSelect = r.title
  paint(g, r, "Overseer", { voice = { "Task" }, murmur = { "Component", "Field" }, flat = { "RUNNING" } })
  paint(g, r, "DapUI", {
    voice = { "WatchesValue" },
    murmur = { "Source", "StepOver", "StepInto", "StepOut", "StepBack" },
    whisper = { "WatchesEmpty" },
    trace = { "Decoration" },
    grown = { "PlayPause", "Restart" },
    sharp = { "Stop", "WatchesError" },
    flat = { "ModifiedValue" },
    cue = { "BreakpointsInfo" },
  })
  g.DapUIFloatBorder = { link = "FloatBorder" }
  g.DapUIWinSelect = r.title
  return g
end
