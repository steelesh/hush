import type { Colors } from "../palette.ts";
import type { Target } from "../target.ts";

const theme = (c: Colors) => `set -g dark-theme-black "${c.pitch}"
set -g dark-theme-white "${c.voice}"
set -g dark-theme-light-grey "${c.trace}"
set -g dark-theme-dark-grey "${c.room}"
set -g dark-theme-red "${c.sharp}"
set -g dark-theme-green "${c.grown}"
set -g dark-theme-yellow "${c.flat}"
set -g dark-theme-blue "${c.cue}"
set -g dark-theme-magenta "${c.aside}"
set -g dark-theme-cyan "${c.form}"
set -g status-style "fg=${c.murmur},bg=default"
set -g window-status-current-style "fg=${c.call},bold"
set -g message-style "fg=${c.call},bg=default"
set -g message-command-style "fg=${c.voice},bg=default"
set -g mode-style "fg=${c.voice},bg=${c.near},bold"
set -g menu-selected-style "fg=${c.voice},bg=${c.near},bold"
set -g popup-style "fg=${c.voice},bg=default"
set -g popup-border-style "fg=${c.trace}"
set -g pane-active-border-style "fg=#{?pane_modal_flag,themeblue,#{?pane_marked,thememagenta,#{?synchronize-panes,themered,#{?pane_in_mode,themeyellow,${c.murmur}}}}}"
set -g display-panes-colour "${c.murmur}"
set -g display-panes-active-colour "${c.call}"
set -g copy-mode-selection-style "bg=${c.held}"
set -g copy-mode-match-style "fg=${c.voice},bg=${c.tint_search}"
set -g copy-mode-current-match-style "fg=${c.pitch},bg=${c.call}"
set -g copy-mode-mark-style "fg=${c.voice},bg=${c.tint_change}"
set -g copy-mode-line-number-style "fg=${c.breath}"
set -g copy-mode-current-line-number-style "fg=${c.call}"
set -g switch-mode-match-style "fg=${c.call},bold"
`;

export const tmux: Target = {
  name: "tmux",
  files: ({ colors }) => [{ path: "themes/tmux/hush.conf", content: theme(colors) }],
};
