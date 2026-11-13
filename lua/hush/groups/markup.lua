return function(r)
  local g = {}
  g["@markup"] = { fg = r.voice }
  g["@markup.heading"] = { fg = r.aside, bold = true }
  g["@markup.italic"] = { link = "Italic" }
  g["@markup.link"] = { fg = r.aside }
  g["@markup.link.url"] = { fg = r.aside, underline = true }
  g["@markup.raw"] = { fg = r.said }
  g["@markup.raw.block"] = { fg = r.voice }
  g["@markup.raw.markdown_inline"] = { fg = r.said, bg = r.lull }
  g["@markup.math"] = { fg = r.said }
  g["@markup.quote"] = { fg = r.whisper }
  g["@markup.list"] = { fg = r.murmur }
  g["@markup.list.checked"] = { fg = r.grown }
  for _, name in ipairs({ "htmlItalic", "htmlBoldItalic", "rstEmphasis", "typstMarkupItalic", "manItalic" }) do
    g[name] = { link = "Italic" }
  end
  g.manSectionHeading = { link = "@markup.heading" }
  g.manReference = { link = "@markup.link" }
  g.RenderMarkdownCodeInline = { link = "@markup.raw.markdown_inline" }
  for level = 1, 6 do
    g["RenderMarkdownH" .. level .. "Bg"] = { bg = r.lull }
  end
  return g
end
