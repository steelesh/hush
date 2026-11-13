return function(r)
  local g = {}
  g.Normal = { fg = r.voice, bg = r.page }
  g.Cursor = { fg = r.pitch, bg = r.caret }
  g.lCursor = { link = "Cursor" }
  g.TermCursor = { link = "Cursor" }
  g.CursorLine = { bg = r.room }
  g.CursorColumn = { bg = r.lull }
  g.ColorColumn = { link = "CursorColumn" }
  g.LineNr = { fg = r.breath }
  g.CursorLineNr = { fg = r.call }
  g.SignColumn = {}
  g.FoldColumn = { fg = r.breath }
  g.Folded = { fg = r.whisper }
  g.WinSeparator = { fg = r.trace }
  g.MsgSeparator = { fg = r.trace }
  g.NonText = { fg = r.trace }
  g.SpecialKey = { fg = r.breath }
  g.Conceal = { fg = r.murmur }
  g.Visual = { bg = r.held }
  g.Search = { fg = r.voice, bg = r.tint_search }
  g.CurSearch = r.here
  g.Substitute = { fg = r.pitch, bg = r.flat }
  g.MatchParen = { fg = r.call, bg = r.held, bold = true }
  g.QuickFixLine = { bg = r.near, bold = true }
  g.StatusLine = { fg = r.murmur }
  g.StatusLineNC = { fg = r.whisper }
  g.WinBar = { fg = r.murmur }
  g.WinBarNC = { fg = r.breath }
  g.TabLineSel = r.current
  g.TabLineFill = {}
  g.ModeMsg = r.title
  g.MoreMsg = { fg = r.murmur }
  g.Question = { fg = r.voice }
  g.ErrorMsg = { fg = r.sharp }
  g.WarningMsg = { fg = r.flat }
  g.OkMsg = { fg = r.grown }
  g.Title = r.title
  g.Directory = { fg = r.form }
  g.Bold = { bold = true }
  g.Italic = { underline = true }
  g.debugPC = { bg = r.tint_add }
  g.debugBreakpoint = { fg = r.sharp }
  g.NvimInternalError = { fg = r.pitch, bg = r.sharp }
  g.RedrawDebugClear = { bg = r.tint_search }
  g.RedrawDebugComposed = { bg = r.tint_add }
  g.RedrawDebugRecompose = { bg = r.tint_delete }
  for group, color in pairs({ SpellBad = r.sharp, SpellCap = r.flat, SpellLocal = r.cue, SpellRare = r.nudge }) do
    g[group] = { sp = color, undercurl = true }
  end
  return g
end
