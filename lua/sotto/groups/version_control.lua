local paint = require("sotto.paint")

return function(r)
  local g = {}
  g.Added = { fg = r.grown }
  g.Changed = { fg = r.flat }
  g.Removed = { fg = r.sharp }
  g.DiffAdd = { bg = r.tint_add }
  g.DiffChange = { bg = r.tint_change }
  g.DiffDelete = { bg = r.tint_delete }
  g.DiffText = { bg = r.tint_add_strong }
  for _, kind in ipairs({ "Add", "Change", "Delete", "Changedelete", "Topdelete", "Untracked" }) do
    for _, column in ipairs({ "", "Nr", "Cul" }) do
      g["GitSignsStaged" .. kind .. column] = { fg = r.trace }
    end
  end
  g.GitSignsAddInline = { link = "DiffText" }
  g.GitSignsChangeInline = { link = "DiffText" }
  g.GitSignsDeleteInline = { bg = r.tint_delete_strong }
  g.GitSignsCurrentLineBlame = { fg = r.breath }
  g.GitSignsDiffStaged = { fg = r.murmur }
  g.GitSignsNoEOLPreview = { fg = r.whisper }
  g.DiffviewFilePanelTitle = r.title
  paint(g, r, "Diffview", {
    call = { "FilePanelSelected", "Primary" },
    voice = { "Reference", "CommitRemoteRef", "CommitMerged" },
    murmur = { "FilePanelCounter", "Hash", "Secondary", "ReflogSelector" },
    whisper = { "Dim1" },
    trace = { "FolderSign", "DiffDeleteDim" },
  })
  g.ResolveOursMarker = { bg = r.tint_add_strong }
  g.ResolveOursSection = { bg = r.tint_add }
  g.ResolveTheirsMarker = { bg = r.held }
  g.ResolveTheirsSection = { bg = r.tint_change }
  g.ResolveAncestorMarker = { bg = r.tint_search }
  g.ResolveAncestorSection = { bg = r.lull }
  g.ResolveSeparatorMarker = { bg = r.held }
  g.ClaudeCodeInlineDiffAdd = { link = "DiffAdd" }
  g.ClaudeCodeInlineDiffDelete = { bg = r.tint_delete, strikethrough = true }
  g.ClaudeCodeInlineDiffAddSign = { link = "Added" }
  g.ClaudeCodeInlineDiffDeleteSign = { link = "Removed" }
  return g
end
