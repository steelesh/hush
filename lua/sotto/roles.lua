return function(colors, opts)
  local r = vim.deepcopy(colors)
  r.page = opts.transparent and "NONE" or opts.black and colors.pitch or colors.still
  r.float = opts.transparent and "NONE" or colors.room
  r.quiet = opts.quiet == true
  r.here = { fg = colors.pitch, bg = colors.call }
  r.current = { fg = colors.voice, bg = colors.near, bold = true }
  r.title = { fg = colors.call, bold = true }
  return setmetatable(r, { __index = function(_, key) error(("sotto: unknown role %q"):format(tostring(key)), 2) end })
end
