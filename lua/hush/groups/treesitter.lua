return function(r)
  local g = {}
  g["@variable"] = { fg = r.voice }
  g["@variable.builtin"] = { link = "@variable" }
  g["@variable.parameter"] = { fg = r.aside }
  g["@variable.parameter.builtin"] = { link = "@variable.parameter" }
  g["@variable.member"] = { link = "@property" }
  g["@property"] = { fg = r.form }
  g["@constant"] = { fg = r.voice }
  g["@constant.builtin"] = { fg = r.call }
  g["@module"] = { fg = r.voice }
  g["@module.builtin"] = { link = "@module" }
  g["@function.builtin"] = { link = "Function" }
  g["@constructor"] = { link = "Type" }
  g["@constructor.lua"] = { link = "@punctuation.bracket" }
  g["@type.builtin"] = { link = "Type" }
  g["@attribute"] = { fg = r.murmur }
  g["@attribute.builtin"] = { link = "@attribute" }
  g["@tag.builtin"] = { link = "Tag" }
  g["@tag.attribute"] = { fg = r.aside }
  g["@tag.delimiter"] = { link = "Delimiter" }
  g["@punctuation.special"] = { link = "Delimiter" }
  g["@string.special"] = { link = "String" }
  g["@string.escape"] = { link = "SpecialChar" }
  g["@string.documentation"] = { link = "Comment" }
  g["@string.special.url"] = { link = "@markup.link.url" }
  g["@comment.note"] = { fg = r.nudge }
  return g
end
