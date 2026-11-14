local root = vim.fs.dirname(vim.fs.dirname(vim.fs.dirname(vim.fs.normalize(vim.fn.fnamemodify(debug.getinfo(1, "S").source:sub(2), ":p")))))
vim.o.runtimepath = root .. "," .. vim.env.VIMRUNTIME
vim.o.packpath = ""
vim.o.background = "light"

local failures, checks = {}, 0

local function check(ok, message)
  checks = checks + 1
  if not ok then failures[#failures + 1] = message end
end

local function hex(n) return string.format("#%06x", n) end

local function read(path)
  local file = assert(io.open(path, "r"))
  local text = file:read("*a")
  file:close()
  return text
end

local bold = {
  "@markup.heading",
  "@markup.strong",
  "Bold",
  "DapUIWinSelect",
  "DiffviewFilePanelTitle",
  "FloatTitle",
  "LazyButtonActive",
  "LazyH2",
  "LspSignatureActiveParameter",
  "MasonHeader",
  "MasonHeaderSecondary",
  "MasonHeading",
  "MatchParen",
  "ModeMsg",
  "NeotestAdapterName",
  "NeotestWinSelect",
  "PmenuMatch",
  "PmenuSel",
  "QuickFixLine",
  "SnacksPickerCursorLine",
  "SnacksPickerMatch",
  "TabLineSel",
  "Title",
}

local slots = {
  "bg",
  "border",
  "comment",
  "current",
  "danger",
  "diff_add",
  "diff_add_text",
  "diff_change",
  "diff_delete",
  "dim",
  "emphasis",
  "fg",
  "float",
  "heading",
  "hint",
  "info",
  "line",
  "muted",
  "search",
  "select",
  "success",
  "warning",
}

local attributes = { fg = true, bg = true, sp = true, link = true, blend = true, bold = true, underline = true, undercurl = true, strikethrough = true }

local source = vim.json.decode(read(vim.fs.joinpath(root, "palette.json")))
local known = {}
for _, entry in pairs(source.colors) do
  known[entry.hex] = true
end

local function documented()
  local names, count = {}, 0
  local function add(name)
    if not names[name] then count = count + 1 end
    names[name] = true
  end
  local doc = vim.fs.joinpath(vim.env.VIMRUNTIME, "doc")
  for _, file in ipairs({ "syntax.txt", "diagnostic.txt", "lsp.txt", "terminal.txt", "treesitter.txt" }) do
    local text = read(vim.fs.joinpath(doc, file))
    for name in text:gmatch("%*hl%-([%w_]+)%*") do
      add(name)
    end
    for name in text:gmatch("\n(@[%l%d_.]+)[ \t]") do
      add(name)
    end
  end
  local conventions = read(vim.fs.joinpath(doc, "syntax.txt")):match("%*group%-name%*.-\n(Comment\t.-)\nNote that highlight group names")
  for name in (conventions or ""):gmatch("\n(%u%a+)\t") do
    add(name)
  end
  return names, count
end

local function resolve(name)
  while name do
    local live = vim.api.nvim_get_hl(0, { name = name, link = false, create = false })
    if next(live) or name:sub(1, 1) ~= "@" then return live end
    name = name:match("^(.+)%.[^.]+$")
  end
  return {}
end

local stock = vim.api.nvim_get_hl(0, {})

local function exists(groups, name)
  while name do
    if groups[name] or stock[name] then return true end
    name = name:sub(1, 1) == "@" and name:match("^(.+)%.[^.]+$") or nil
  end
  return false
end

local function static()
  local where = "static: "
  local scanned = 0
  for _, dir in ipairs({ "colors", "lua", "tests/nvim" }) do
    for path, kind in vim.fs.dir(vim.fs.joinpath(root, dir), { depth = 4 }) do
      local file = dir .. "/" .. path
      if kind == "file" and file:match("%.lua$") and file ~= "lua/sotto/palette.lua" then
        scanned = scanned + 1
        local text = read(vim.fs.joinpath(root, file))
        check(not text:find("#%x%x%x%x%x%x"), where .. file .. " holds a color literal")
        check(not text:find("%-%-"), where .. file .. " holds a comment")
      end
    end
  end
  check(scanned > 0, where .. "no hand-written Lua file was scanned")

  local sotto = require("sotto")
  local palette = require("sotto.palette")
  check(vim.deep_equal(sotto.colors(), palette.colors) and sotto.colors() ~= palette.colors, where .. "colors() must return a copy of the palette")
  local got = sotto.slots()
  local names = vim.tbl_keys(got)
  table.sort(names)
  check(vim.deep_equal(names, slots), where .. "slots() returns " .. table.concat(names, " "))
  for slot, color in pairs(got) do
    check(known[color], where .. "slot " .. slot .. " is not a palette color")
  end

  local roles = require("sotto.roles")(palette.colors, {})
  check(not pcall(function() return roles.missing end), where .. "an unknown role must raise an error")
  local total = 0
  for path in vim.fs.dir(vim.fs.joinpath(root, "lua/sotto/groups")) do
    if path ~= "init.lua" then total = total + vim.tbl_count(require("sotto.groups." .. path:gsub("%.lua$", ""))(roles)) end
  end
  local built = vim.tbl_count(require("sotto.groups")(roles))
  check(total == built, where .. "the domain files define " .. total .. " groups but " .. built .. " are built: one is defined twice or a file is not listed")

  check(not pcall(sotto.setup, { transparant = true }), where .. "an unknown option must be rejected")
  check(not pcall(sotto.setup, { transparent = "yes" }), where .. "a transparent that is not a boolean must be rejected")
  check(not pcall(sotto.setup, { black = "yes" }), where .. "a black that is not a boolean must be rejected")
  check(not pcall(sotto.setup, { quiet = "yes" }), where .. "a quiet that is not a boolean must be rejected")
  check(not pcall(sotto.setup, { on_highlights = true }), where .. "an on_highlights that is not a function must be rejected")
  check(pcall(sotto.setup), where .. "setup without options must be accepted")
end

local function scheme(transparent, stale)
  local where = (transparent and "transparent" or "solid") .. ": "
  local probe = "SottoProbe" .. (transparent and "Transparent" or "Solid")
  local sotto = require("sotto")
  local c = require("sotto.palette").colors
  local groups, calls = nil, 0
  sotto.setup({
    transparent = transparent,
    on_highlights = function(built, colors)
      groups, calls = built, calls + 1
      built[probe] = { fg = colors.call }
      built.Title.fg = colors.grown
    end,
  })
  local ok, err = pcall(vim.cmd.colorscheme, "sotto")
  check(ok, where .. "colorscheme sotto failed: " .. tostring(err))
  check(vim.v.errmsg == "", where .. "load reported " .. vim.v.errmsg)
  check(vim.g.colors_name == "sotto", where .. "colors_name is " .. tostring(vim.g.colors_name))
  check(vim.o.background == "dark", where .. "background is " .. vim.o.background)
  check(calls == 1, where .. "on_highlights was called " .. calls .. " times")
  if not groups then return 0 end

  local function fg(name) return hex(vim.api.nvim_get_hl(0, { name = name, link = false }).fg or 0) end
  check(fg(probe) == c.call, where .. "a group added by on_highlights was not applied")
  check(fg("Title") == c.grown and fg("ModeMsg") == c.call, where .. "a change made by on_highlights must reach that group only")
  if stale then check(next(vim.api.nvim_get_hl(0, { name = stale })) == nil, where .. stale .. " survived a second load") end
  groups[probe], groups.Title.fg = nil, c.call

  local expected = {}
  for _, name in ipairs(bold) do
    expected[name] = true
    check(vim.api.nvim_get_hl(0, { name = name }).bold == true, where .. name .. " is on the bold list but is not bold")
  end

  for name, spec in pairs(groups) do
    for key, value in pairs(spec) do
      check(attributes[key], where .. name .. " sets unexpected attribute " .. key)
      if key == "fg" or key == "bg" or key == "sp" then
        check(known[value] or value == "NONE", where .. name .. "." .. key .. " is not a palette color: " .. tostring(value))
      end
    end
    if spec.link then
      check(vim.tbl_count(spec) == 1, where .. name .. " mixes a link with attributes")
      check(exists(groups, spec.link), where .. name .. " links to " .. spec.link .. ", which does not exist")
      local target, hops = spec.link, 0
      while groups[target] and groups[target].link and hops < 20 do
        target, hops = groups[target].link, hops + 1
      end
      check(hops < 20, where .. name .. " is part of a link cycle")
    end
  end

  local names, count = documented()
  check(count > 250, where .. "only " .. count .. " documented groups and captures were found")
  for name in pairs(vim.api.nvim_get_hl(0, {})) do
    names[name] = true
  end
  for name in pairs(names) do
    local live = resolve(name)
    check(not live.italic, where .. name .. " is italic")
    check(not vim.api.nvim_get_hl(0, { name = name, create = false }).bold or expected[name], where .. name .. " is bold but not on the bold list")
    for _, key in ipairs({ "fg", "bg", "sp" }) do
      check(not live[key] or known[hex(live[key])], where .. name .. "." .. key .. " resolves outside the palette: " .. hex(live[key] or 0))
    end
  end

  local function bg(name)
    local value = resolve(name).bg
    return value and hex(value) or nil
  end
  check(bg("Normal") == (not transparent and c.still or nil), where .. "Normal background is " .. tostring(bg("Normal")))
  check(bg("Folded") == nil, where .. "folds must not look selected")
  for _, name in ipairs({ "@attribute", "@attribute.builtin", "@lsp.type.annotation", "@lsp.type.decorator", "@lsp.type.builtinAttribute", "javaAnnotation" }) do
    check(fg(name) == c.aside and bg(name) == nil, where .. name .. " must distinguish annotations from comments without a fill")
  end
  check(fg("Comment") == c.whisper, where .. "comments must remain quieter than annotations")
  check(bg("CursorLine") == c.room, where .. "optional current lines must be quieter than selections")
  check(bg("Visual") == c.held and not resolve("Visual").fg, where .. "selection must keep syntax colors on held")
  for _, name in ipairs({ "NormalFloat", "FloatBorder", "FloatTitle", "FloatFooter", "Pmenu", "PmenuBorder" }) do
    check(bg(name) == (not transparent and c.room or nil), where .. name .. " background is " .. tostring(bg(name)))
  end
  for _, name in ipairs({ "SignColumn", "FoldColumn", "LineNr", "CursorLineNr", "EndOfBuffer", "WinBar", "WinBarNC", "WinSeparator" }) do
    check(bg(name) == nil, where .. name .. " must take the page background, has " .. tostring(bg(name)))
  end
  for _, name in ipairs({ "StatusLine", "StatusLineNC", "TabLine", "TabLineFill", "DiagnosticSignError" }) do
    check(bg(name) == nil, where .. name .. " must take the page background, has " .. tostring(bg(name)))
  end

  for slot, name in ipairs(source.ansi) do
    local got = vim.g["terminal_color_" .. (slot - 1)]
    check(got == source.colors[name].hex, where .. "terminal_color_" .. (slot - 1) .. " is " .. tostring(got) .. ", expected " .. name)
  end
  return vim.tbl_count(groups), probe
end

local function black()
  local sotto = require("sotto")
  local c = require("sotto.palette").colors
  sotto.setup({ black = true })
  vim.cmd.colorscheme("sotto")
  local page = vim.api.nvim_get_hl(0, { name = "Normal", link = false }).bg
  check(page and hex(page) == c.pitch, "black: Normal background is " .. tostring(page and hex(page)))
  check(sotto.slots().bg == c.pitch, "black: slots().bg is " .. tostring(sotto.slots().bg))
  sotto.setup({ black = true, transparent = true })
  vim.cmd.colorscheme("sotto")
  check(vim.api.nvim_get_hl(0, { name = "Normal", link = false }).bg == nil, "black: transparent must still clear the page")
end

local function quiet()
  local sotto = require("sotto")
  local c = require("sotto.palette").colors
  local icons = { "Azure", "Blue", "Cyan", "Green", "Grey", "Orange", "Yellow", "Purple", "Red" }
  local tone = function(name) return hex(vim.api.nvim_get_hl(0, { name = "MiniIcons" .. name, link = false }).fg) end
  sotto.setup({})
  vim.cmd.colorscheme("sotto")
  local tones = {}
  for _, name in ipairs(icons) do
    tones[tone(name)] = true
  end
  check(vim.tbl_count(tones) > 3, "quiet: without the option the icons must keep their separate tones")
  sotto.setup({ quiet = true })
  vim.cmd.colorscheme("sotto")
  for _, name in ipairs(icons) do
    check(tone(name) == c.breath, "quiet: MiniIcons" .. name .. " is " .. tone(name) .. ", expected breath")
  end
  sotto.setup({})
end

static()
local count, probe = scheme(true)
scheme(false, probe)
black()
quiet()

if #failures > 0 then
  table.sort(failures)
  io.stderr:write(table.concat(failures, "\n") .. "\n" .. #failures .. " of " .. checks .. " checks failed\n")
  os.exit(1)
end
io.stdout:write("sotto: " .. checks .. " checks passed, " .. count .. " groups, transparent, solid, black and quiet\n")
