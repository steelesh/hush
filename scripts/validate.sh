#!/bin/sh
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
themes=$root/themes
tmp=$(mktemp -d "${TMPDIR:-/tmp}/sotto-validate.XXXXXX")
home=$tmp/home
server=sotto-validate-$$
passed=0
failed=0
skipped=0

cleanup() {
  sandbox tmux -L "$server" kill-server >/dev/null 2>&1
  rm -rf "$tmp"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

have() { command -v "$1" >/dev/null 2>&1; }
skip() {
  skipped=$((skipped + 1))
  printf 'skip  %s: %s\n' "$1" "$2"
}

check() {
  label=$1
  shift
  if "$@" >"$tmp/out" 2>&1; then
    passed=$((passed + 1))
    printf 'ok    %s\n' "$label"
  else
    failed=$((failed + 1))
    printf 'FAIL  %s\n' "$label"
    sed 's/^/        /' "$tmp/out"
  fi
}

sandbox() (
  unset TMUX BAT_THEME BAT_CONFIG_PATH BAT_CACHE_PATH DELTA_FEATURES DELTA_PAGER FZF_DEFAULT_OPTS FZF_DEFAULT_OPTS_FILE
  unset LG_CONFIG_FILE STARSHIP_CONFIG GIT_CONFIG_GLOBAL NO_COLOR
  export HOME="$home" XDG_CONFIG_HOME="$home/.config" XDG_CACHE_HOME="$home/.cache"
  export XDG_DATA_HOME="$home/.local/share" XDG_STATE_HOME="$home/.local/state"
  export GIT_CONFIG_NOSYSTEM=1 STARSHIP_CACHE="$home/.cache/starship" COLORTERM=truecolor TERM=xterm-256color
  cd "$tmp" && "$@"
)

silent() {
  "$@" >"$tmp/silent" 2>&1 || {
    cat "$tmp/silent"
    return 1
  }
  if [ -s "$tmp/silent" ]; then
    cat "$tmp/silent"
    return 1
  fi
}

inspect() { node "$tmp/inspect.mjs" "$@"; }

toml() {
  if have taplo; then
    check "$1" sandbox taplo check --no-schema "$2"
  elif have python3; then
    check "$1" python3 -c 'import sys, tomllib; tomllib.load(open(sys.argv[1], "rb"))' "$2"
  else
    skip "$1" "no toml parser (taplo or python3)"
  fi
}

yaml() {
  if have yq; then
    check "$1" yq . "$2"
  elif have ruby; then
    check "$1" ruby -ryaml -e 'YAML.load_file(ARGV[0])' "$2"
  else
    skip "$1" "no yaml parser (yq or ruby)"
  fi
}

json() {
  check "$1" node -e 'JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"))' "$2"
}

plist() {
  if have plutil; then
    check "$1" plutil -lint "$2"
  elif have python3; then
    check "$1" python3 -c 'import sys, plistlib; plistlib.load(open(sys.argv[1], "rb"))' "$2"
  else
    skip "$1" "no plist parser (plutil or python3)"
  fi
}

tmux_knows() {
  sandbox tmux -L "$server" -f /dev/null new-session -d -s probe \; show-options -g "$1" >/dev/null 2>&1
  status=$?
  sandbox tmux -L "$server" kill-server >/dev/null 2>&1
  return $status
}

tmux_source() {
  sandbox tmux -L "$server" -f /dev/null new-session -d -s sotto &&
    sandbox tmux -L "$server" source-file "$1"
  status=$?
  sandbox tmux -L "$server" kill-server >/dev/null 2>&1
  return $status
}

fzf_filter() {
  printf 'sotto\n' | sandbox env FZF_DEFAULT_OPTS_FILE="$1" fzf --filter sotto
}

bat_render() {
  mkdir -p "$home/.config/bat/themes" &&
    cp "$1" "$home/.config/bat/themes/" &&
    sandbox bat cache --build &&
    sandbox bat --theme=sotto --color=always --paging=never --style=numbers --highlight-line=1 "$root/samples/sample.ts" >"$tmp/bat.out" &&
    inspect palette "$tmp/bat.out"
}

delta_render() {
  cp "$1" "$home/.gitconfig" &&
    {
      printf 'diff --git a/a.ts b/a.ts\nindex 1111111..2222222 100644\n--- a/a.ts\n+++ b/a.ts\n@@ -1,6 +1,7 @@ function greet() {\n'
      printf ' const a = 1;\n-const b = "two";\n+const b = "three";\t\n'
      printf '\033[1;35m-const c = moved();\033[m\n\033[1;34m-const d = moved();\033[m\n'
      printf '\033[1;36m+const c = moved();\033[m\n\033[1;33m+const d = moved();\033[m\n'
      printf '+const e = "%0200d";\n' 0
    } >"$tmp/fixture.diff" &&
    sandbox delta --paging=never --line-numbers --side-by-side --width=80 <"$tmp/fixture.diff" >"$tmp/delta.out" 2>"$tmp/delta.err" &&
    silent cat "$tmp/delta.err" &&
    inspect palette "$tmp/delta.out"
}

lazygit_keys() {
  known=$(sandbox lazygit --config | yq '.gui.theme | keys | .[]') &&
    for key in $(yq '.. | select(tag == "!!map") | keys | .[]' "$1" | grep -vx -e gui -e theme -e "'\*'" -e '\*'); do
      printf '%s\n' "$known" | grep -qx "$key" || {
        printf 'not a gui.theme key of this lazygit: %s\n' "$key"
        return 1
      }
    done
}

yazi_schema() {
  sandbox taplo check --schema "file://$tmp/yazi.schema.json" "$1"
}

starship_prompt() {
  {
    printf 'format = "'
    sed -n 's/^\([a-z-]*\) = "#.*/[x](\1) /p' "$1" | tr -d '\n'
    printf '"\n'
    cat "$1"
  } >"$tmp/starship.toml" &&
    sandbox env STARSHIP_CONFIG="$tmp/starship.toml" starship prompt >"$tmp/starship.out" 2>"$tmp/starship.err" &&
    silent cat "$tmp/starship.err" &&
    inspect palette "$tmp/starship.out"
}

btop_lines() {
  [ -f "$1" ] && ! grep -Evn '^theme\[[a-z_]+\]="#[0-9a-f]{6}"$' "$1"
}

btop_keys() {
  binary=$(command -v btop) &&
    sed 's/^theme\[\(.*\)\]=.*/\1/' "$1" | while read -r key; do
      LC_ALL=C grep -aqF "$key" "$binary" || {
        printf 'not a color this btop knows: %s\n' "$key"
        return 1
      }
    done
}

lnav_check() {
  mkdir -p "$home/.lnav/configs/installed" &&
    cp "$1" "$home/.lnav/configs/installed/" &&
    silent sandbox lnav -W -C
}

fastfetch_render() {
  sandbox fastfetch --config "$1" --pipe false --structure title:os:memory:disk >"$tmp/fastfetch.out" 2>&1 &&
    ! grep -i 'error' "$tmp/fastfetch.out" &&
    inspect palette "$tmp/fastfetch.out"
}

borders_values() {
  sh -n "$1" &&
    grep -Eqx 'active_color=0x[0-9a-f]{8}' "$1" &&
    grep -Eqx 'inactive_color=0x[0-9a-f]{8}' "$1"
}

mandoc_selectors() {
  for page in mandoc mdoc man; do
    path=$(man -w "$page" 2>/dev/null) && sandbox mandoc -T html "$path"
  done >"$tmp/mandoc.html"
  inspect selectors "$1" "$tmp/mandoc.html"
}

if ! have node; then
  printf 'FAIL  node is required\n'
  exit 1
fi

mkdir -p "$home"
cat >"$tmp/inspect.mjs" <<'EOF'
import { readFileSync } from "node:fs";

const [mode, ...paths] = process.argv.slice(2);
const [text, other] = paths.map((path) => readFileSync(path, "utf8"));
const problems = [];

if (mode === "palette") {
  const colors = JSON.parse(readFileSync(new URL(process.env.PALETTE), "utf8")).colors;
  const known = new Set(Object.values(colors).map((entry) => entry.hex));
  let direct = 0;
  for (const [, body] of text.matchAll(/\x1b\[([0-9;:]*)m/g)) {
    const codes = body.split(/[;:]/).map(Number);
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      if ([38, 48, 58].includes(code) && codes[i + 1] === 2) {
        const hex = `#${codes.slice(i + 2, i + 5).map((part) => part.toString(16).padStart(2, "0")).join("")}`;
        if (!known.has(hex)) problems.push(`${hex} is not a palette color`);
        direct += 1;
        i += 4;
      } else if ([38, 48, 58].includes(code) && codes[i + 1] === 5) {
        problems.push(`indexed color ${codes[i + 2]} was left to the terminal`);
        i += 2;
      } else if ((code >= 30 && code <= 37) || (code >= 40 && code <= 47) || (code >= 90 && code <= 107)) {
        problems.push(`ansi color code ${code} was left to the terminal`);
      }
    }
  }
  if (direct === 0) problems.push("the output has no direct colors");
}

if (mode === "variables") {
  const used = new Set([...text.matchAll(/var\(--([a-z0-9-]+)\)/g)].map((match) => match[1]));
  const defined = new Set([...text.matchAll(/--([a-z0-9-]+):/g)].map((match) => match[1]));
  for (const name of used) if (!defined.has(name)) problems.push(`--${name} is used but not defined`);
  for (const name of defined) if (!used.has(name)) problems.push(`--${name} is defined but not used`);
}

if (mode === "selectors") {
  const tags = new Map();
  for (const [, tag, classes] of other.matchAll(/<([a-z0-9]+) class="([^"]+)"/g)) {
    for (const name of classes.split(/\s+/)) tags.set(name, (tags.get(name) ?? new Set()).add(tag));
  }
  if (tags.size === 0) problems.push("mandoc produced no classes");
  for (const [selector, tag, name] of text.matchAll(/(?<![\w.-])([a-z][a-z0-9]*)\.([A-Za-z][\w-]*)/g)) {
    const seen = tags.get(name);
    if (seen && !seen.has(tag)) problems.push(`${selector} matches nothing, mandoc writes ${[...seen].map((found) => `${found}.${name}`).join(", ")}`);
  }
}

if (problems.length > 0) {
  console.error([...new Set(problems)].join("\n"));
  process.exit(1);
}
EOF
export PALETTE="file://$root/palette.json"

ghostty=$(command -v ghostty || true)
[ -n "$ghostty" ] || ghostty=/Applications/Ghostty.app/Contents/MacOS/ghostty
if [ -x "$ghostty" ]; then
  check "ghostty +validate-config" sandbox "$ghostty" +validate-config "--config-file=$themes/ghostty/sotto"
else
  skip ghostty "ghostty is not installed"
fi

if ! have tmux; then
  skip tmux "tmux is not installed"
elif tmux_knows dark-theme-black; then
  check "tmux source-file in a private server" tmux_source "$themes/tmux/sotto.conf"
else
  skip tmux "this tmux is older than the options the theme sets"
fi

if have fzf; then
  check "fzf --filter with the options file" fzf_filter "$themes/fzf/sotto.fzf"
else
  skip fzf "fzf is not installed"
fi

plist "bat tmTheme is a property list" "$themes/bat/sotto.tmTheme"
if have bat; then
  check "bat renders a sample in palette colors" bat_render "$themes/bat/sotto.tmTheme"
else
  skip bat "bat is not installed"
fi

if have git; then
  check "delta git config --file" git config --file "$themes/delta/sotto.gitconfig" --list
else
  skip "delta git config" "git is not installed"
fi
if have delta && [ -f "$home/.cache/bat/themes.bin" ]; then
  check "delta renders a diff in palette colors" delta_render "$themes/delta/sotto.gitconfig"
else
  skip delta "needs delta and bat"
fi

yaml "lazygit yaml" "$themes/lazygit/sotto.yml"
if have lazygit && have yq; then
  check "lazygit theme keys exist in this lazygit" lazygit_keys "$themes/lazygit/sotto.yml"
else
  skip lazygit "needs lazygit and yq"
fi

toml "yazi toml" "$themes/yazi/sotto.toml"
if have taplo && have curl && curl -fsSL -m 20 -o "$tmp/yazi.schema.json" https://yazi-rs.github.io/schemas/theme.json; then
  check "yazi theme schema" yazi_schema "$themes/yazi/sotto.toml"
else
  skip "yazi theme schema" "needs taplo, curl and the network"
fi

toml "starship toml" "$themes/starship/sotto.toml"
if have starship; then
  check "starship draws every palette name in palette colors" starship_prompt "$themes/starship/sotto.toml"
else
  skip starship "starship is not installed"
fi

check "btop theme lines" btop_lines "$themes/btop/sotto.theme"
if have btop; then
  check "btop knows every color name" btop_keys "$themes/btop/sotto.theme"
else
  skip btop "btop is not installed"
fi

json "lnav json" "$themes/lnav/sotto.json"
if have lnav; then
  check "lnav -W -C" lnav_check "$themes/lnav/sotto.json"
else
  skip lnav "lnav is not installed"
fi

json "fastfetch json" "$themes/fastfetch/sotto.jsonc"
if have fastfetch; then
  check "fastfetch draws in palette colors" fastfetch_render "$themes/fastfetch/sotto.jsonc"
else
  skip fastfetch "fastfetch is not installed"
fi

json "vscode manifest json" "$themes/vscode/package.json"
json "vscode theme json" "$themes/vscode/themes/sotto-color-theme.json"
check "borders color values" borders_values "$themes/borders/sotto.sh"

for sheet in bman bmd; do
  check "$sheet css variables are defined and used" inspect variables "$themes/$sheet/sotto.css"
done
if have mandoc && have man; then
  check "bman selectors match mandoc html" mandoc_selectors "$themes/bman/sotto.css"
else
  skip "bman selectors" "needs mandoc and man"
fi

printf '\n%s passed, %s failed, %s skipped\n' "$passed" "$failed" "$skipped"
[ "$failed" -eq 0 ]
