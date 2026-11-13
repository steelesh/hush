local M = {}

local types = { transparent = "boolean", on_highlights = "function" }
local config = {}

function M.setup(opts)
  opts = opts or {}
  for key, value in pairs(opts) do
    if not types[key] then error(("hush: unknown option %q"):format(tostring(key)), 2) end
    vim.validate(key, value, types[key])
  end
  config = opts
end

function M.colors() return vim.deepcopy(require("hush.palette").colors) end

function M.slots() return require("hush.slots")(require("hush.palette").colors) end

function M.load()
  local palette = require("hush.palette")
  local groups = require("hush.groups")(require("hush.roles")(palette.colors, config.transparent))
  if config.on_highlights then config.on_highlights(groups, M.colors()) end
  vim.cmd.highlight("clear")
  vim.o.background = "dark"
  vim.g.colors_name = "hush"
  for name, spec in pairs(groups) do
    vim.api.nvim_set_hl(0, name, spec)
  end
  for slot, name in ipairs(palette.ansi) do
    vim.g["terminal_color_" .. (slot - 1)] = palette.colors[name]
  end
end

return M
