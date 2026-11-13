return function(colors, transparent)
  local r = vim.deepcopy(colors)
  r.page = transparent and "NONE" or colors.still
  r.float = transparent and "NONE" or colors.room
  r.here = { fg = colors.pitch, bg = colors.call }
  r.current = { fg = colors.voice, bg = colors.near, bold = true }
  r.title = { fg = colors.call, bold = true }
  return setmetatable(r, { __index = function(_, key) error(("hush: unknown role %q"):format(tostring(key)), 2) end })
end
