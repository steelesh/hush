return function(r)
  local g = {}
  g.Comment = { fg = r.whisper }
  g.SpecialComment = { link = "Comment" }
  g.Identifier = { fg = r.voice }
  g.Function = { fg = r.call }
  g.Macro = { link = "Function" }
  g.Boolean = { fg = r.call }
  g.Constant = { fg = r.said }
  g.String = { fg = r.said }
  g.Type = { fg = r.form }
  g.Tag = { fg = r.form }
  g.Statement = { fg = r.rest }
  g.PreProc = { link = "Statement" }
  g.StorageClass = { link = "Statement" }
  g.Special = { fg = r.rest }
  g.Operator = { fg = r.murmur }
  g.Delimiter = { fg = r.murmur }
  g.Debug = { fg = r.murmur }
  g.Ignore = { fg = r.trace }
  g.Error = { fg = r.sharp }
  g.Todo = { fg = r.cue }
  return g
end
