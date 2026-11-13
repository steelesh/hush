local domains = { "editor", "floats", "syntax", "treesitter", "markup", "lsp", "completion", "version_control", "annotations", "pickers", "panels" }

return function(r)
  local groups = {}
  for _, domain in ipairs(domains) do
    for name, spec in pairs(require("hush.groups." .. domain)(r)) do
      groups[name] = vim.deepcopy(spec)
    end
  end
  return groups
end
