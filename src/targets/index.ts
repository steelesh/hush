import type { Target } from "../target.ts";
import { bat } from "./bat.ts";
import { bman } from "./bman.ts";
import { bmd } from "./bmd.ts";
import { borders } from "./borders.ts";
import { btop } from "./btop.ts";
import { delta } from "./delta.ts";
import { fastfetch } from "./fastfetch.ts";
import { fzf } from "./fzf.ts";
import { ghostty } from "./ghostty.ts";
import { jetbrains } from "./jetbrains/index.ts";
import { lazygit } from "./lazygit.ts";
import { lnav } from "./lnav.ts";
import { neovim } from "./neovim.ts";
import { starship } from "./starship.ts";
import { tmux } from "./tmux.ts";
import { vscode } from "./vscode.ts";
import { yazi } from "./yazi.ts";

export const targets: Target[] = [
  ghostty,
  tmux,
  fzf,
  delta,
  bat,
  lazygit,
  yazi,
  starship,
  btop,
  lnav,
  fastfetch,
  borders,
  bman,
  bmd,
  vscode,
  jetbrains,
  neovim,
];
