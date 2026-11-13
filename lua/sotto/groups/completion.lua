local paint = require("sotto.paint")

return function(r)
  local g = {}
  g.BlinkCmpMenuBorder = { link = "PmenuBorder" }
  g.BlinkCmpDocBorder = { link = "FloatBorder" }
  g.BlinkCmpDocSeparator = { link = "FloatBorder" }
  g.BlinkCmpSignatureHelpBorder = { link = "FloatBorder" }
  g.BlinkCmpLabelMatch = { link = "PmenuMatch" }
  g.BlinkCmpLabelDeprecated = { fg = r.whisper, strikethrough = true }
  g.BlinkCmpSource = { fg = r.breath }
  g.BlinkCmpGhostText = { fg = r.breath }
  g.BlinkCmpDocCursorLine = { bg = r.near }
  g.CopilotSuggestion = { fg = r.breath }
  g.CopilotAnnotation = { fg = r.breath }
  paint(g, r, "MiniIcons", {
    rest = { "Azure", "Blue" },
    form = { "Cyan", "Green" },
    murmur = { "Grey" },
    said = { "Orange", "Yellow" },
    aside = { "Purple" },
    call = { "Red" },
  })
  return g
end
