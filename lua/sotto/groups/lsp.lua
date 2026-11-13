return function(r)
  local g = {}
  for severity, color in pairs({ Error = r.sharp, Warn = r.flat, Info = r.cue, Hint = r.nudge, Ok = r.grown }) do
    g["Diagnostic" .. severity] = { fg = color }
    g["DiagnosticUnderline" .. severity] = { sp = color, undercurl = true }
  end
  g.DiagnosticDeprecated = { sp = r.whisper, strikethrough = true }
  g.LspInlayHint = { fg = r.breath }
  g.LspCodeLens = { fg = r.breath }
  g.LspCodeLensSeparator = { fg = r.trace }
  g.LspReferenceText = { bg = r.lull }
  g.LspReferenceWrite = { bg = r.near }
  g.LspSignatureActiveParameter = r.title
  g.SnippetTabstop = { bg = r.near }
  g.SnippetTabstopActive = { bg = r.held }
  g["@lsp.type.variable"] = {}
  g["@lsp.type.macro"] = { link = "Macro" }
  g["@lsp.type.annotation"] = { link = "@attribute" }
  g["@lsp.type.decorator"] = { link = "@attribute" }
  g["@lsp.type.builtinAttribute"] = { link = "@attribute" }
  g["@lsp.mod.deprecated"] = { strikethrough = true }
  g["@lsp.typemod.function.defaultLibrary"] = { link = "@function.builtin" }
  return g
end
