return function(r)
  local g = {}
  g.NormalFloat = { fg = r.voice, bg = r.float }
  g.FloatBorder = { fg = r.trace, bg = r.float }
  g.FloatTitle = { fg = r.call, bg = r.float, bold = true }
  g.FloatFooter = { fg = r.whisper, bg = r.float }
  g.FloatShadow = { bg = r.still, blend = 80 }
  g.FloatShadowThrough = { bg = r.still, blend = 100 }
  g.Pmenu = { link = "NormalFloat" }
  g.PmenuBorder = { link = "FloatBorder" }
  g.PmenuSel = r.current
  g.PmenuKind = { fg = r.murmur }
  g.PmenuExtra = { fg = r.whisper }
  g.PmenuMatch = r.title
  g.PmenuMatchSel = { link = "PmenuMatch" }
  g.PmenuThumb = { bg = r.trace }
  g.ComplHint = { fg = r.breath }
  g.PreInsert = { link = "ComplHint" }
  return g
end
