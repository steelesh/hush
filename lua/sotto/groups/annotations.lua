return function(r)
  local g = {}
  for tag, color in pairs({ FIX = r.sharp, TODO = r.cue, HACK = r.flat, WARN = r.flat, NOTE = r.nudge, PERF = r.murmur, TEST = r.murmur }) do
    g["TodoBg" .. tag] = { fg = r.pitch, bg = color }
    g["TodoFg" .. tag] = { fg = color }
    g["TodoSign" .. tag] = { link = "TodoFg" .. tag }
  end
  g.MiniHipatternsFixme = { link = "TodoBgFIX" }
  g.MiniHipatternsHack = { link = "TodoBgHACK" }
  g.MiniHipatternsTodo = { link = "TodoBgTODO" }
  g.MiniHipatternsNote = { link = "TodoBgNOTE" }
  g.LogLvInfo = { link = "DiagnosticInfo" }
  g.LogLvPass = { link = "DiagnosticOk" }
  g.LogLvSuccess = { link = "DiagnosticOk" }
  g.LogLvNotice = { link = "DiagnosticHint" }
  return g
end
