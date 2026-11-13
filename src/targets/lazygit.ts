import type { Colors } from "../palette.ts";
import type { Target } from "../target.ts";

const theme = (c: Colors) => `gui:
  theme:
    authorColors:
      '*': '${c.voice}'
    activeBorderColor:
      - '${c.call}'
      - bold
    inactiveBorderColor:
      - '${c.trace}'
    optionsTextColor:
      - '${c.murmur}'
    selectedLineBgColor:
      - '${c.near}'
    inactiveViewSelectedLineBgColor:
      - '${c.lull}'
    cherryPickedCommitBgColor:
      - '${c.tint_change}'
    cherryPickedCommitFgColor:
      - '${c.aside}'
    markedBaseCommitBgColor:
      - '${c.flat}'
    markedBaseCommitFgColor:
      - '${c.pitch}'
    unstagedChangesColor:
      - '${c.sharp}'
    defaultFgColor:
      - '${c.voice}'
    searchingActiveBorderColor:
      - '${c.voice}'
      - bold
`;

export const lazygit: Target = {
  name: "lazygit",
  files: ({ colors }) => [{ path: "themes/lazygit/sotto.yml", content: theme(colors) }],
};
