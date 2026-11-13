local M = {}

local types = { transparent = "boolean", black = "boolean", on_highlights = "function" }
local config = {}

function M.setup(opts)
  opts = opts or {}
  for key, value in pairs(opts) do
    if not types[key] then error(("sotto: unknown option %q"):format(tostring(key)), 2) end
    vim.validate(key, value, types[key])
  end
  config = opts
end

function M.colors() return vim.deepcopy(require("sotto.palette").colors) end

function M.slots() return require("sotto.slots")(require("sotto.palette").colors, config.black) end

function M.load()
  local palette = require("sotto.palette")
  local groups = require("sotto.groups")(require("sotto.roles")(palette.colors, config))
  if config.on_highlights then config.on_highlights(groups, M.colors()) end
  vim.cmd.highlight("clear")
  vim.o.background = "dark"
  vim.g.colors_name = "sotto"
  for name, spec in pairs(groups) do
    vim.api.nvim_set_hl(0, name, spec)
  end
  for slot, name in ipairs(palette.ansi) do
    vim.g["terminal_color_" .. (slot - 1)] = palette.colors[name]
  end
end

return M
