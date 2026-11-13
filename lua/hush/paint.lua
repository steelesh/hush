return function(g, r, prefix, tones)
  for tone, names in pairs(tones) do
    for _, name in ipairs(names) do
      g[prefix .. name] = { fg = r[tone] }
    end
  end
end
