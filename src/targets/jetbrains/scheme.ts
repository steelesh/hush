import { alpha } from "../../color.ts";
import { faint, half } from "../../opacity.ts";
import { type Colors, type Palette, slots } from "../../palette.ts";
import { type RoleName, type Style, syntax } from "../../syntax.ts";
import { lines, xml } from "../../text.ts";
import type { Variant } from "../../variant.ts";
import { each, merge, under } from "./sheet.ts";

const bare = (color: string) => color.slice(1);

type Look = { fg?: string; bg?: string; bold?: true; effect?: [color: string, kind: number]; stripe?: string };
type Looks = Record<string, Look>;

const box = 0;
const line = 1;
const wave = 2;
const strike = 3;
const dotted = 5;

const parentScheme = "Darcula";

const languages: Partial<Record<RoleName, string[]>> = {
  comment: [
    "CUSTOM_LINE_COMMENT_ATTRIBUTES",
    "CUSTOM_MULTI_LINE_COMMENT_ATTRIBUTES",
    "HAML_COMMENT",
    "SASS_COMMENT",
    "BASH.SHEBANG",
    "XML_COMMENT",
    "HTML_COMMENT",
    "CSS.COMMENT",
    "YAML_COMMENT",
    "PROPERTIES.LINE_COMMENT",
    "SQL_COMMENT",
    "MARKDOWN_COMMENT",
    "REGEXP.COMMENT",
  ],
  string: [
    "CUSTOM_STRING_ATTRIBUTES",
    "HTML_ATTRIBUTE_VALUE",
    "XML_ATTRIBUTE_VALUE",
    "HTTP_REQUEST_PARAMETER_VALUE",
    "PROPERTIES.VALUE",
    "CSS.STRING",
    "CSS.URL",
    "SQL_STRING",
    "YAML_SCALAR_STRING",
    "YAML_SCALAR_DSTRING",
  ],
  number: ["CUSTOM_NUMBER_ATTRIBUTES", "CSS.NUMBER", "CSS.UNIT", "SQL_NUMBER"],
  constant: ["MERMAID_CONSTANT"],
  escape: [
    "CUSTOM_VALID_STRING_ESCAPE_ATTRIBUTES",
    "HTML_ENTITY_REFERENCE",
    "XML_ENTITY_REFERENCE",
    "PROPERTIES.VALID_STRING_ESCAPE",
    "REGEXP.ESC_CHARACTER",
    "REGEXP.QUOTE_CHARACTER",
    "REGEXP.CHAR_CLASS",
  ],
  keyword: [
    "CUSTOM_KEYWORD1_ATTRIBUTES",
    "GROOVY_KEYWORD",
    "CSS.IMPORTANT",
    "CSS.KEYWORD",
    "SQL_KEYWORD",
    "JSP_DIRECTIVE_NAME",
    "HAML_FILTER",
    "SASS_DIRECTIVE",
    "VELOCITY_DIRECTIVE",
    "VELOCITY_KEYWORD",
    "XPATH.KEYWORD",
    "MERMAID_KEYWORD",
    "MERMAID_DIAGRAM_NAME",
  ],
  label: ["KOTLIN_LABEL", "YAML_ANCHOR", "BASH.HERE_DOC_START", "BASH.HERE_DOC_END", "SQL_LABEL"],
  operator: ["PROPERTIES.KEY_VALUE_SEPARATOR", "REGEXP.META", "HAML_RUBY_START", "MERMAID_EDGE", "CSS.AMPERSAND", "YAML_SIGN"],
  function: [
    "CUSTOM_KEYWORD3_ATTRIBUTES",
    "STATIC_METHOD_ATTRIBUTES",
    "Static method access",
    "Groovy method declaration",
    "ATTR_INTERNAL_CALL_ID",
    "IntelliJComposableCallTextAttributes",
    "KOTLIN_DYNAMIC_FUNCTION_CALL",
    "KOTLIN_PACKAGE_FUNCTION_CALL",
    "JS.GLOBAL_FUNCTION",
    "JS.INSTANCE_MEMBER_FUNCTION",
    "BASH.EXTERNAL_COMMAND",
    "BASH.INTERNAL_COMMAND",
    "BASH.FUNCTION_CALL",
    "BASH.FUNCTION_DEF_NAME",
    "CSS.FUNCTION",
    "SASS_MIXIN",
    "SQL_PROCEDURE",
    "XPATH.FUNCTION",
  ],
  type: [
    "CUSTOM_KEYWORD2_ATTRIBUTES",
    "Class",
    "Scala Type Alias",
    "Scala Type parameter",
    "KOTLIN_TYPE_PARAMETER",
    "TS.TYPE_PARAMETER",
    "CSS.CLASS_NAME",
    "HAML_CLASS",
    "SQL_TABLE",
    "SQL_TYPE",
    "SQL_DATABASE_OBJECT",
    "MERMAID_GENERIC",
  ],
  property: [
    "INSTANCE_FIELD_ATTRIBUTES",
    "STATIC_FIELD_ATTRIBUTES",
    "STATIC_FINAL_FIELD_ATTRIBUTES",
    "Instance property reference ID",
    "Static property reference ID",
    "KOTLIN_DYNAMIC_PROPERTY_CALL",
    "KOTLIN_PROPERTY_WITH_BACKING_FIELD",
    "PROPERTIES.KEY",
    "JSON.PROPERTY_KEY",
    "YAML_SCALAR_KEY",
    "CSS.PROPERTY_NAME",
    "SQL_COLUMN",
    "SQL_OUTER_QUERY_COLUMN",
    "SQL_SYNTHETIC_ENTITY",
  ],
  tag: [
    "HTML_TAG_NAME",
    "HTML_CUSTOM_TAG_NAME",
    "XML_TAG_NAME",
    "XML_CUSTOM_TAG_NAME",
    "CSS.TAG_NAME",
    "HAML_TAG",
    "HAML_XHTML",
    "SASS_RULE",
    "XPATH.XPATH_NAME",
    "JS.JSX_CLIENT_COMPONENT",
  ],
  parameter: [
    "CUSTOM_KEYWORD4_ATTRIBUTES",
    "IMPLICIT_ANONYMOUS_CLASS_PARAMETER_ATTRIBUTES",
    "TEMPLATE_VARIABLE_ATTRIBUTES",
    "KOTLIN_NAMED_ARGUMENT",
    "KOTLIN_CLOSURE_DEFAULT_PARAMETER",
    "KOTLIN_CONTEXT_ARGUMENT",
    "JS.PARAMETER",
    "GHERKIN_REGEXP_PARAMETER",
    "HTTP_REQUEST_PARAMETER_NAME",
    "SQL_PARAMETER",
  ],
  attribute: ["ANNOTATION_ATTRIBUTE_NAME_ATTRIBUTES", "HTML_ATTRIBUTE_NAME", "XML_ATTRIBUTE_NAME", "CSS.ATTRIBUTE_NAME", "SASS_ATTRIBUTE"],
  variable: [
    "JS.GLOBAL_VARIABLE",
    "JS.LOCAL_VARIABLE",
    "COFFEESCRIPT.GLOBAL_VARIABLE",
    "NG.SIGNAL",
    "XML_TAG_DATA",
    "CSS.IDENT",
    "CSS.HASH",
    "HAML_ID",
    "LESS_VARIABLE",
    "SASS_VARIABLE",
    "SASS_CONSTANT",
    "VELOCITY_REFERENCE",
    "XPATH.XPATH_VARIABLE",
    "SQL_LOCAL_ALIAS",
    "SQL_VARIABLE",
    "MERMAID_IDENTIFIER",
  ],
  module: ["SQL_SCHEMA"],
  punctuation: [
    "HTML_TAG",
    "XML_TAG",
    "Closure braces",
    "List/map to object conversion",
    "KOTLIN_FUNCTION_LITERAL_BRACES_AND_ARROW",
    "REGEXP.BRACES",
    "REGEXP.BRACKETS",
    "REGEXP.PARENTHS",
    "HTTP_REQUEST_MULTIPART_BOUNDARY",
    "MERMAID_FRONTMATTER_DELIMITER",
  ],
  annotation: ["ANNOTATION_NAME_ATTRIBUTES", "XML_PROLOGUE", "CSS.PSEUDO"],
  heading: ["MERMAID_TITLE"],
  invalid: ["CUSTOM_INVALID_STRING_ESCAPE_ATTRIBUTES", "PROPERTIES.INVALID_STRING_ESCAPE", "UNMATCHED_BRACE_ATTRIBUTES", "WRONG_REFERENCES_ATTRIBUTES"],
};

const backed = ["MARKDOWN_CODE_SPAN", "MARKDOWN_CODE_BLOCK", "MARKDOWN_CODE_FENCE"];

const consoleSlots = [
  "BLACK",
  "RED",
  "GREEN",
  "YELLOW",
  "BLUE",
  "MAGENTA",
  "CYAN",
  "GRAY",
  "DARKGRAY",
  "RED_BRIGHT",
  "GREEN_BRIGHT",
  "YELLOW_BRIGHT",
  "BLUE_BRIGHT",
  "MAGENTA_BRIGHT",
  "CYAN_BRIGHT",
  "WHITE",
];

const terminalHues = ["BLACK", "RED", "GREEN", "YELLOW", "BLUE", "MAGENTA", "CYAN", "WHITE"];
const terminalSlots = [...terminalHues, ...terminalHues.map((hue) => `${hue}_BRIGHT`)];

const styled = (color: string, style?: Style): Look =>
  style === "bold" ? { fg: color, bold: true } : style === "underline" ? { fg: color, effect: [color, line] } : { fg: color };

function roles(c: Colors): Looks {
  const looks = merge(
    "the syntax table",
    ...syntax.map((entry) => each([...(entry.jetbrains ?? []), ...(languages[entry.name] ?? [])], styled(c[entry.color], entry.style))),
  );
  for (const key of backed) looks[key] = { ...looks[key], bg: c.lull };
  return looks;
}

function attributes(palette: Palette): Looks {
  const c = palette.colors;
  const plain: Look = {};
  const squiggle = (color: string): Look => ({ effect: [color, wave], stripe: color });
  const link = (color: string): Look => ({ fg: color, effect: [color, line] });
  const status = (color: string, tint: string): Look => ({ fg: color, bg: tint });
  const outline = (color: string, text?: string): Look => (text ? { fg: text, effect: [color, box] } : { effect: [color, box] });

  const text: Looks = {
    TEXT: { fg: c.voice, bg: c.still },
    DEFAULT_HIGHLIGHTED_REFERENCE: { effect: [c.murmur, line] },
    DEFAULT_TEMPLATE_LANGUAGE_COLOR: { bg: c.lull },
    FOLDED_TEXT_ATTRIBUTES: { fg: c.whisper },
    DELETED_TEXT_ATTRIBUTES: { fg: c.whisper, bg: c.tint_delete, effect: [c.whisper, strike] },
    MATCHED_BRACE_ATTRIBUTES: { fg: c.call, bg: c.held, bold: true },
    MATCHED_TAG_NAME: { bg: c.held },
    IDENTIFIER_UNDER_CARET_ATTRIBUTES: { bg: c.lull, stripe: c.trace },
    WRITE_IDENTIFIER_UNDER_CARET_ATTRIBUTES: { bg: c.near, stripe: c.trace },
    SEARCH_RESULT_ATTRIBUTES: { fg: c.voice, bg: c.tint_search, stripe: c.call },
    WRITE_SEARCH_RESULT_ATTRIBUTES: { fg: c.voice, bg: c.tint_search, stripe: c.call },
    TEXT_SEARCH_RESULT_ATTRIBUTES: { fg: c.voice, bg: c.tint_search, stripe: c.call },
    REGEXP_MATCHED_GROUPS: { bg: c.near },
    "REGEXP.REDUNDANT_ESCAPE": { fg: c.whisper },
    HYPERLINK_ATTRIBUTES: link(c.aside),
    CTRL_CLICKABLE: link(c.aside),
    FOLLOWED_HYPERLINK_ATTRIBUTES: link(c.nudge),
    INACTIVE_HYPERLINK_ATTRIBUTES: { effect: [c.trace, line] },
    LIVE_TEMPLATE_ATTRIBUTES: outline(c.murmur),
    LIVE_TEMPLATE_INACTIVE_SEGMENT: outline(c.trace),
    BLINKING_HIGHLIGHTS_ATTRIBUTES: outline(c.murmur),
    CODE_LENS_BORDER_COLOR: outline(c.trace),
    BOOKMARKS_ATTRIBUTES: { stripe: c.call },
    TODO_DEFAULT_ATTRIBUTES: { fg: c.cue, stripe: c.cue },
    TODO_ATTRIBUTES: { fg: c.cue },
    DOC_CODE_BLOCK: { fg: c.voice, bg: c.lull },
    DOC_CODE_INLINE: { fg: c.said, bg: c.lull },
    DOC_TIPS_SHORTCUT: outline(c.trace, c.murmur),
    BREADCRUMBS_DEFAULT: { fg: c.murmur },
    BREADCRUMBS_HOVERED: { fg: c.voice, bg: c.lull },
    BREADCRUMBS_CURRENT: { fg: c.voice, bg: c.near },
    BREADCRUMBS_INACTIVE: { fg: c.breath },
    ...each(["INJECTED_LANGUAGE_FRAGMENT", "JavaScript:INJECTED_LANGUAGE_FRAGMENT", "JOIN_POINT", "BEAN.ACTIVE"], plain),
    "BEAN.INACTIVE": { fg: c.breath },
    QUTE_BACKGROUND: { bg: c.lull },
    VELOCITY_SCRIPTING_BACKGROUND: { bg: c.lull },
    MERMAID_NOTE: { bg: c.lull },
    ...each(["HAML_FILTER_CONTENT", "HAML_RUBY_CODE", "HAML_TEXT", "BASH.BINARY_DATA", "TS.TYPE_GUARD"], plain),
    ...each(
      ["KOTLIN_MUTABLE_VARIABLE", "KOTLIN_BACKING_FIELD_VARIABLE", "KOTLIN_SMART_CAST_VALUE", "KOTLIN_SMART_CAST_RECEIVER", "KOTLIN_SMART_CONSTANT"],
      plain,
    ),
    KOTLIN_COROUTINE_DEBUGGER_VALUE: { fg: c.breath },
    KOTLIN_DEBUG_INFO: outline(c.trace),
    KOTLIN_RESOLVED_TO_ERROR: outline(c.sharp),
    "Unresolved reference access": { fg: c.whisper, effect: [c.trace, dotted] },
    ComposeStateReadScopeHighlightingTextAttributes: { bg: c.near },
    RAINBOW_COLOR0: { fg: c.form },
    RAINBOW_COLOR1: { fg: c.call },
    RAINBOW_COLOR2: { fg: c.rest },
    RAINBOW_COLOR3: { fg: c.said },
    RAINBOW_COLOR4: { fg: c.aside },
  };

  const hints: Looks = {
    ...each(["INLAY_DEFAULT", "INLAY_TEXT_WITHOUT_BACKGROUND", "INLINE_PARAMETER_HINT", "INLAY_BUTTON_HINT", "INLINE_SUGGESTION"], { fg: c.breath }),
    INLINE_PARAMETER_HINT_HIGHLIGHTED: { fg: c.voice, bg: c.near },
    INLINE_PARAMETER_HINT_CURRENT: { fg: c.call, bg: c.near },
    ...each(["INLAY_BUTTON_DEFAULT", "AI_INLAY_BUTTON_DEFAULT"], outline(c.trace, c.murmur)),
    ...each(["INLAY_BUTTON_HOVERED", "INLAY_BUTTON_FOCUSED", "AI_INLAY_BUTTON_HOVERED", "AI_INLAY_BUTTON_FOCUSED"], outline(c.murmur, c.voice)),
    ...each(["INVISIBLE_INLAY_BUTTON", "COMPOSE_INVISIBLE_PORT_BUTTON"], outline(c.trace, c.trace)),
    INLINE_PROMPT: { fg: c.nudge },
    INLINE_PROMPT_PROGRESS_DARK: { fg: c.nudge },
    INLINE_PROMPT_PROGRESS_LIGHT: { fg: c.aside },
    INLINE_STACK_FRAMES: { bg: c.near },
  };

  const problems: Looks = {
    ERRORS_ATTRIBUTES: squiggle(c.sharp),
    FILESTATUS_ERRORS: squiggle(c.sharp),
    WARNING_ATTRIBUTES: squiggle(c.flat),
    GENERIC_SERVER_ERROR_OR_WARNING: squiggle(c.flat),
    INFO_ATTRIBUTES: squiggle(c.cue),
    INFORMATION_ATTRIBUTES: plain,
    RUNTIME_ERROR: { effect: [c.sharp, dotted], stripe: c.sharp },
    NOT_USED_ELEMENT_ATTRIBUTES: { fg: c.whisper },
    DEPRECATED_ATTRIBUTES: { effect: [c.whisper, strike] },
    MARKED_FOR_REMOVAL_ATTRIBUTES: { effect: [c.sharp, strike] },
    TYPO: { effect: [c.nudge, wave] },
    GRAMMAR_ERROR: { effect: [c.nudge, wave] },
    TEXT_STYLE_ERROR: { effect: [c.sharp, dotted] },
    TEXT_STYLE_WARNING: { effect: [c.flat, dotted] },
    TEXT_STYLE_SUGGESTION: { effect: [c.cue, dotted] },
    DUPLICATE_FROM_SERVER: { bg: c.lull },
    NO_ANALYSIS: { stripe: c.trace },
    DO_NOT_SHOW: { stripe: c.grown },
    LINE_FULL_COVERAGE: { fg: c.grown },
    LINE_PARTIAL_COVERAGE: { fg: c.flat },
    LINE_NONE_COVERAGE: { fg: c.sharp },
  };

  const versions: Looks = {
    DIFF_INSERTED: { bg: c.tint_add, stripe: c.grown },
    DIFF_MODIFIED: { bg: c.tint_change, stripe: c.flat },
    DIFF_DELETED: { bg: c.tint_delete, stripe: c.sharp },
    DIFF_CONFLICT: { bg: c.tint_search, stripe: c.flat },
    ...each(["DIFF_ABSENT", "DIFF_UNKNOWN", "DIFF_DELETED_FROM_FS"], plain),
  };

  const debug: Looks = {
    BREAKPOINT_ATTRIBUTES: { bg: c.tint_delete, stripe: c.sharp },
    EXECUTIONPOINT_ATTRIBUTES: { bg: c.tint_add, stripe: c.grown },
    NOT_TOP_FRAME_ATTRIBUTES: { bg: c.tint_change },
    EVALUATED_EXPRESSION_ATTRIBUTES: { bg: c.near },
    EVALUATED_EXPRESSION_EXECUTION_LINE_ATTRIBUTES: { bg: c.held },
    DEBUGGER_INLINED_VALUES: { fg: c.breath },
    DEBUGGER_INLINED_VALUES_EXECUTION_LINE: { fg: c.murmur },
    DEBUGGER_INLINED_VALUES_MODIFIED: { fg: c.flat },
    DEBUGGER_SMART_STEP_INTO_TARGET: { bg: c.near },
    DEBUGGER_SMART_STEP_INTO_SELECTION: { bg: c.held, effect: [c.murmur, box] },
    "SPY-JS.EXCEPTION": { bg: c.tint_delete },
    "SPY-JS.FUNCTION_SCOPE": { bg: c.lull },
    "SPY-JS.PROGRAM_SCOPE": { bg: c.lull },
    "SPY-JS.PATH_LEVEL_ONE": { bg: c.tint_add },
    "SPY-JS.PATH_LEVEL_TWO": { effect: [c.murmur, line] },
    "SPY-JS.VALUE_HINT": outline(c.trace),
  };

  const output: Looks = {
    CONSOLE_NORMAL_OUTPUT: { fg: c.voice },
    CONSOLE_OUTPUT: plain,
    CONSOLE_SYSTEM_OUTPUT: { fg: c.whisper },
    CONSOLE_USER_INPUT: { fg: c.aside },
    CONSOLE_ERROR_OUTPUT: { fg: c.sharp },
    CONSOLE_RANGE_TO_EXECUTE: outline(c.trace),
    LOG_EXPIRED_ENTRY: { fg: c.breath },
    ...Object.fromEntries(slots(palette, consoleSlots).map(([slot, color]) => [`CONSOLE_${slot}_OUTPUT`, { fg: color, bg: color }])),
    ...Object.fromEntries(slots(palette, terminalSlots).map(([slot, color]) => [`BLOCK_TERMINAL_${slot}`, { fg: color, bg: color }])),
    BLOCK_TERMINAL_COMMAND: { fg: c.voice, bold: true },
    BLOCK_TERMINAL_SEARCH_ENTRY: { fg: c.voice, bg: c.tint_search },
    BLOCK_TERMINAL_CURRENT_SEARCH_ENTRY: { fg: c.pitch, bg: c.call },
    BLOCK_TERMINAL_GENERATE_COMMAND_PROMPT_TEXT: { fg: c.nudge },
    TERMINAL_CLASS_NAME_LOG_REFERENCE: { effect: [c.trace, dotted] },
    TERMINAL_COMMAND_TO_RUN_USING_IDE: { bg: c.near },
  };

  const views: Looks = {
    $TEXT_NODE: { bold: true },
    $OCCURENCE: { bold: true },
    $SELECTED_OCCURENCE: { bold: true },
    $NUMBER_OF_USAGES: { fg: c.breath },
    $EXCLUDED_NODE: { fg: c.breath, effect: [c.breath, strike] },
    $INVALID_PREFIX: { fg: c.sharp },
    $READ_ONLY_PREFIX: { fg: c.flat },
    $HAS_READ_ONLY_CHILD: { fg: c.flat },
    COMPOSE_SERVICE_STATUS_SUCCESS: status(c.grown, c.tint_add),
    COMPOSE_SERVICE_STATUS_ERROR: status(c.sharp, c.tint_delete),
    COMPOSE_SERVICE_STATUS_NEUTRAL: status(c.murmur, c.lull),
    KUBERNETES_POD_STATUS_SUCCESS: status(c.grown, c.tint_add),
    KUBERNETES_POD_STATUS_ERROR: status(c.sharp, c.tint_delete),
    KUBERNETES_POD_STATUS_OTHER: status(c.murmur, c.lull),
  };

  return merge("the editor scheme", roles(c), text, hints, problems, versions, debug, output, views);
}

function surfaces(c: Colors): Record<string, string> {
  const thumb = alpha(c.trace, faint);
  const grip = alpha(c.trace, half);
  const clear = alpha(c.pitch, 0);
  const bars = ["ScrollBar", "ScrollBar.Transparent", "ScrollBar.Mac", "ScrollBar.Mac.Transparent"];

  const editor: Record<string, string> = {
    CARET_COLOR: c.caret,
    CARET_ROW_COLOR: "",
    SELECTION_BACKGROUND: c.held,
    SELECTION_BACKGROUND_INACTIVE: c.near,
    SELECTION_FOREGROUND: "",
    LINE_NUMBERS_COLOR: c.breath,
    LINE_NUMBER_ON_CARET_ROW_COLOR: c.call,
    GUTTER_BACKGROUND: c.still,
    EDITOR_GUTTER_BACKGROUND: c.still,
    INDENT_GUIDE: c.near,
    SELECTED_INDENT_GUIDE: c.murmur,
    MATCHED_BRACES_INDENT_GUIDE_COLOR: c.murmur,
    VISUAL_INDENT_GUIDE: c.lull,
    STRING_CONTENT_INDENT_GUIDE: c.near,
    WHITESPACES: c.trace,
    SOFT_WRAP_SIGN_COLOR: c.breath,
    RIGHT_MARGIN_COLOR: c.lull,
    TEARLINE_COLOR: c.still,
    SELECTED_TEARLINE_COLOR: c.still,
    METHOD_SEPARATORS_COLOR: c.lull,
    FOLDED_TEXT_BORDER_COLOR: "",
    READONLY_FRAGMENT_BACKGROUND: "",
    GRID_STRIPE_COLOR: c.lull,
    RECURSIVE_CALL_ATTRIBUTES: c.held,
    STICKY_LINES_BACKGROUND: c.still,
    STICKY_LINES_BORDER_COLOR: c.lull,
    STICKY_LINES_HOVERED_COLOR: c.lull,
    MODIFIED_TAB_ICON: c.flat,
    DOC_COMMENT_GUIDE: c.trace,
    DOC_COMMENT_LINK: c.aside,
    DOCUMENTATION_COLOR: c.room,
    LOOKUP_COLOR: c.room,
    INFORMATION_HINT: c.room,
    QUESTION_HINT: c.tint_change,
    PROMOTION_PANE: c.tint_change,
    ERROR_HINT: c.tint_delete,
    HINT_BORDER: c.trace,
    NOTIFICATION_BACKGROUND: c.lull,
    RECENT_LOCATIONS_SELECTION: c.near,
    INLINE_REFACTORING_SETTINGS_DEFAULT: c.near,
    INLINE_REFACTORING_SETTINGS_HOVERED: c.held,
    INLINE_REFACTORING_SETTINGS_FOCUSED: c.held,
    CONSOLE_BACKGROUND_KEY: c.pitch,
  };

  const versions: Record<string, string> = {
    ADDED_LINES_COLOR: c.grown,
    MODIFIED_LINES_COLOR: c.flat,
    DELETED_LINES_COLOR: c.sharp,
    WHITESPACES_MODIFIED_LINES_COLOR: c.trace,
    IGNORED_ADDED_LINES_BORDER_COLOR: c.trace,
    IGNORED_MODIFIED_LINES_BORDER_COLOR: c.trace,
    IGNORED_DELETED_LINES_BORDER_COLOR: c.trace,
    DIFF_SEPARATORS_BACKGROUND: c.lull,
    DIFF_SEPARATOR_WAVE: c.trace,
    ANNOTATIONS_COLOR: c.breath,
    ANNOTATIONS_LAST_COMMIT_COLOR: c.murmur,
    VCS_ANNOTATIONS_COLOR_1: c.held,
    VCS_ANNOTATIONS_COLOR_2: c.near,
    VCS_ANNOTATIONS_COLOR_3: c.lull,
    VCS_ANNOTATIONS_COLOR_4: c.room,
    VCS_ANNOTATIONS_COLOR_5: c.still,
    ...each(["FILESTATUS_ADDED", "FILESTATUS_COPIED", "FILESTATUS_addedOutside", "FILESTATUS_UNKNOWN"], c.grown),
    ...each(
      [
        "FILESTATUS_MODIFIED",
        "FILESTATUS_modifiedOutside",
        "FILESTATUS_RENAMED",
        "FILESTATUS_NOT_CHANGED_IMMEDIATE",
        "FILESTATUS_NOT_CHANGED_RECURSIVE",
        "FILESTATUS_HIJACKED",
        "FILESTATUS_OBSOLETE",
      ],
      c.flat,
    ),
    ...each(
      [
        "FILESTATUS_DELETED",
        "FILESTATUS_IDEA_FILESTATUS_DELETED_FROM_FILE_SYSTEM",
        "FILESTATUS_IDEA_FILESTATUS_MERGED_WITH_CONFLICTS",
        "FILESTATUS_IDEA_FILESTATUS_MERGED_WITH_BOTH_CONFLICTS",
        "FILESTATUS_IDEA_FILESTATUS_MERGED_WITH_PROPERTY_CONFLICTS",
        "FILESTATUS_changelistConflict",
      ],
      c.sharp,
    ),
    ...each(["FILESTATUS_MERGED", "FILESTATUS_SWITCHED"], c.nudge),
    ...each(["FILESTATUS_IDEA_FILESTATUS_IGNORED", "FILESTATUS_SUPPRESSED"], c.breath),
    FILESTATUS_NOT_CHANGED: "",
  };

  const terminal: Record<string, string> = {
    BLOCK_TERMINAL_BLOCK_BACKGROUND_START: c.lull,
    BLOCK_TERMINAL_BLOCK_BACKGROUND_END: c.lull,
    BLOCK_TERMINAL_HOVERED_BLOCK_BACKGROUND_START: c.lull,
    BLOCK_TERMINAL_HOVERED_BLOCK_BACKGROUND_END: c.lull,
    BLOCK_TERMINAL_SELECTED_BLOCK_BACKGROUND: c.near,
    BLOCK_TERMINAL_SELECTED_BLOCK_STROKE_COLOR: c.murmur,
    BLOCK_TERMINAL_INACTIVE_SELECTED_BLOCK_BACKGROUND: c.lull,
    BLOCK_TERMINAL_INACTIVE_SELECTED_BLOCK_STROKE_COLOR: c.trace,
    BLOCK_TERMINAL_ERROR_BLOCK_STROKE_COLOR: c.sharp,
    BLOCK_TERMINAL_PROMPT_SEPARATOR_COLOR: c.trace,
    BLOCK_TERMINAL_GENERATE_COMMAND_CARET_COLOR: c.caret,
    BLOCK_TERMINAL_GENERATE_COMMAND_PLACEHOLDER_FOREGROUND: c.breath,
  };

  const controls: Record<string, string> = {
    "ActionButton.hoverBackground": c.near,
    "ActionButton.pressedBackground": c.held,
    "ActionButton.iconTextForeground": c.murmur,
    "Table.hoverBackground": c.lull,
    "Bookmark.iconBackground": c.call,
    "Bookmark.Mnemonic.iconBackground": c.near,
    "Bookmark.Mnemonic.iconBorderColor": c.call,
    "Bookmark.Mnemonic.iconForeground": c.voice,
    "ScrollBar.background": clear,
    ...Object.assign(
      {},
      ...bars.map((bar) =>
        under(bar, {
          thumbColor: thumb,
          hoverThumbColor: grip,
          thumbBorderColor: clear,
          hoverThumbBorderColor: clear,
          trackColor: clear,
          hoverTrackColor: clear,
        }),
      ),
    ),
    "Scrollbar.Tabs.ThumbColor": thumb,
    "Scrollbar.Tabs.HoveredThumbColor": grip,
    "Scrollbar.Tabs.TransparentThumbColor": clear,
  };

  return merge("the editor colors", editor, versions, terminal, controls);
}

const option = (name: string, value: string | number, indent: string) => `${indent}<option name="${xml(name)}" value="${value}" />`;

function look(name: string, { fg, bg, bold, effect, stripe }: Look): string {
  const parts = [
    fg ? option("FOREGROUND", bare(fg), "        ") : null,
    bg ? option("BACKGROUND", bare(bg), "        ") : null,
    bold ? option("FONT_TYPE", 1, "        ") : null,
    effect ? option("EFFECT_COLOR", bare(effect[0]), "        ") : null,
    effect ? option("EFFECT_TYPE", effect[1], "        ") : null,
    stripe ? option("ERROR_STRIPE_COLOR", bare(stripe), "        ") : null,
  ].filter((part) => part !== null);
  const value = parts.length > 0 ? ["      <value>", ...parts, "      </value>"] : ["      <value />"];
  return [`    <option name="${xml(name)}">`, ...value, "    </option>"].join("\n");
}

const sorted = <T>(sheet: Record<string, T>): [string, T][] => Object.entries(sheet).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

export function scheme({ name, palette }: Variant): string {
  return lines([
    `<scheme name="${name}" version="142" parent_scheme="${parentScheme}">`,
    "  <colors>",
    ...sorted(surfaces(palette.colors)).map(([name, value]) => option(name, value && bare(value), "    ")),
    "  </colors>",
    "  <attributes>",
    ...sorted(attributes(palette)).map(([name, value]) => look(name, value)),
    "  </attributes>",
    "</scheme>",
  ]);
}
