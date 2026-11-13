import type { Colors, Name } from "./palette.ts";

export type Style = "bold" | "underline";

type Entry = {
  name: string;
  color: Name;
  style?: Style;
  scopes: readonly string[];
  semantic?: readonly string[];
  jetbrains?: readonly string[];
};

const table = [
  {
    name: "comment",
    color: "whisper",
    scopes: ["comment", "punctuation.definition.comment", "string.quoted.docstring", "string.quoted.docstring punctuation.definition.string"],
    semantic: ["comment"],
    jetbrains: ["DEFAULT_LINE_COMMENT", "DEFAULT_BLOCK_COMMENT", "DEFAULT_DOC_COMMENT", "DEFAULT_DOC_MARKUP"],
  },
  { name: "string", color: "said", scopes: ["string", "punctuation.definition.string"], semantic: ["string"], jetbrains: ["DEFAULT_STRING"] },
  { name: "regexp", color: "said", scopes: ["string.regexp"], semantic: ["regexp"], jetbrains: ["JS.REGEXP", "TS.REGEXP"] },
  {
    name: "number",
    color: "said",
    scopes: ["constant.numeric", "keyword.other.unit", "storage.type.numeric.bigint"],
    semantic: ["number"],
    jetbrains: ["DEFAULT_NUMBER"],
  },
  {
    name: "literal",
    color: "said",
    scopes: [
      "constant.character",
      "constant.other.symbol",
      "constant.other.color",
      "support.constant.property-value",
      "support.constant.font-name",
      "support.constant.color",
    ],
    jetbrains: ["CSS.COLOR", "CSS.PROPERTY_VALUE"],
  },
  {
    name: "constant",
    color: "call",
    scopes: ["constant.language", "support.constant"],
    semantic: ["boolean", "variable.readonly.defaultLibrary"],
    jetbrains: ["DEFAULT_PREDEFINED_SYMBOL", "JSON.KEYWORD"],
  },
  {
    name: "escape",
    color: "rest",
    scopes: [
      "constant.character.escape",
      "constant.other.placeholder",
      "constant.character.format.placeholder",
      "constant.character.entity",
      "constant.character.entity punctuation.definition.entity",
      "string.regexp constant.character",
      "constant.other.character-class.regexp",
    ],
    semantic: ["escapeSequence", "formatSpecifier"],
    jetbrains: ["DEFAULT_VALID_STRING_ESCAPE", "DEFAULT_ENTITY"],
  },
  {
    name: "interpolation",
    color: "voice",
    scopes: ["meta.interpolation", "meta.template.expression", "meta.embedded", "string source"],
  },
  {
    name: "keyword",
    color: "rest",
    scopes: [
      "keyword",
      "storage",
      "meta.preprocessor",
      "keyword.operator.new",
      "keyword.operator.expression",
      "keyword.operator.word",
      "keyword.operator.wordlike",
      "keyword.operator.logical.python",
      "keyword.operator.logical.lua",
    ],
    semantic: ["keyword", "modifier"],
    jetbrains: ["DEFAULT_KEYWORD", "DEFAULT_DOC_COMMENT_TAG"],
  },
  {
    name: "label",
    color: "rest",
    scopes: ["entity.name.label", "string.tag.lua", "fenced_code.block.language"],
    semantic: ["label"],
    jetbrains: ["DEFAULT_LABEL"],
  },
  {
    name: "operator",
    color: "murmur",
    scopes: ["keyword.operator", "punctuation.accessor", "storage.type.function.arrow", "constant.language.import-export-all"],
    semantic: ["operator"],
    jetbrains: ["DEFAULT_OPERATION_SIGN", "DEFAULT_DOT"],
  },
  {
    name: "function",
    color: "call",
    scopes: ["entity.name.function", "support.function", "variable.function", "support.macro", "meta.function-call.generic", "entity.name.command"],
    semantic: ["function", "method", "macro"],
    jetbrains: ["DEFAULT_FUNCTION_DECLARATION", "DEFAULT_FUNCTION_CALL", "DEFAULT_INSTANCE_METHOD", "DEFAULT_STATIC_METHOD"],
  },
  {
    name: "type",
    color: "form",
    scopes: [
      "entity.name.type",
      "entity.name.class",
      "entity.name.struct",
      "entity.name.enum",
      "entity.name.trait",
      "entity.name.interface",
      "entity.other.inherited-class",
      "support.type",
      "support.class",
      "storage.type.primitive",
      "storage.type.built-in",
      "storage.type.numeric.go",
      "storage.type.string.go",
      "storage.type.boolean.go",
      "storage.type.byte.go",
      "storage.type.rune.go",
      "storage.type.uintptr.go",
      "storage.type.error.go",
      "new.expr entity.name.function",
      "source.css entity.other.attribute-name.class",
    ],
    semantic: ["class", "enum", "interface", "struct", "type", "typeParameter", "event", "builtinType", "typeAlias", "record"],
    jetbrains: ["DEFAULT_CLASS_NAME", "DEFAULT_CLASS_REFERENCE", "DEFAULT_INTERFACE_NAME", "TYPE_PARAMETER_NAME_ATTRIBUTES"],
  },
  {
    name: "property",
    color: "form",
    scopes: [
      "variable.other.member",
      "variable.other.property",
      "variable.other.object.property",
      "variable.object.property",
      "variable.other.constant.property",
      "support.variable.property",
      "meta.property-name",
      "support.type.property-name",
      "punctuation.support.type.property-name",
      "meta.object-literal.key",
      "meta.mapping.key string",
      "meta.attribute.python",
      "entity.other.attribute.lua",
    ],
    semantic: ["property"],
    jetbrains: ["DEFAULT_INSTANCE_FIELD", "DEFAULT_STATIC_FIELD"],
  },
  { name: "tag", color: "form", scopes: ["entity.name.tag"], jetbrains: ["DEFAULT_TAG"] },
  {
    name: "parameter",
    color: "aside",
    scopes: ["variable.parameter", "constant.other.option"],
    semantic: ["parameter"],
    jetbrains: ["DEFAULT_PARAMETER", "DEFAULT_REASSIGNED_PARAMETER", "DEFAULT_DOC_COMMENT_TAG_VALUE"],
  },
  { name: "attribute", color: "aside", scopes: ["entity.other.attribute-name"], jetbrains: ["DEFAULT_ATTRIBUTE"] },
  {
    name: "variable",
    color: "voice",
    scopes: ["variable", "punctuation.definition.variable", "source.css entity.other.attribute-name.id"],
    semantic: ["variable", "enumMember", "selfParameter", "clsParameter", "selfKeyword"],
    jetbrains: ["DEFAULT_IDENTIFIER", "DEFAULT_LOCAL_VARIABLE", "DEFAULT_REASSIGNED_LOCAL_VARIABLE", "DEFAULT_GLOBAL_VARIABLE", "DEFAULT_CONSTANT"],
  },
  {
    name: "module",
    color: "voice",
    scopes: [
      "entity.name.namespace",
      "entity.name.module",
      "entity.name.type.module",
      "entity.name.type.package",
      "storage.modifier.package",
      "storage.modifier.import",
    ],
    semantic: ["namespace", "module"],
  },
  {
    name: "punctuation",
    color: "murmur",
    scopes: ["punctuation", "meta.brace"],
    jetbrains: ["DEFAULT_BRACES", "DEFAULT_BRACKETS", "DEFAULT_PARENTHS", "DEFAULT_COMMA", "DEFAULT_SEMICOLON"],
  },
  {
    name: "annotation",
    color: "murmur",
    scopes: [
      "meta.annotation",
      "variable.annotation",
      "punctuation.definition.annotation",
      "storage.type.annotation",
      "meta.attribute",
      "entity.name.function.decorator",
      "meta.decorator variable.other.readwrite",
      "meta.decorator entity.name.function",
      "source.css entity.other.attribute-name.pseudo-class",
      "source.css entity.other.attribute-name.pseudo-element",
    ],
    semantic: ["decorator", "annotation", "builtinAttribute"],
    jetbrains: ["DEFAULT_METADATA"],
  },
  {
    name: "heading",
    color: "aside",
    style: "bold",
    scopes: ["markup.heading", "entity.name.section", "punctuation.definition.heading"],
    jetbrains: [
      "MARKDOWN_HEADER",
      "MARKDOWN_HEADER_BOLD",
      "MARKDOWN_HEADER_LEVEL_1",
      "MARKDOWN_HEADER_LEVEL_2",
      "MARKDOWN_HEADER_LEVEL_3",
      "MARKDOWN_HEADER_LEVEL_4",
      "MARKDOWN_HEADER_LEVEL_5",
      "MARKDOWN_HEADER_LEVEL_6",
    ],
  },
  { name: "bold", color: "voice", style: "bold", scopes: ["markup.bold"], jetbrains: ["MARKDOWN_BOLD"] },
  { name: "emphasis", color: "voice", style: "underline", scopes: ["markup.italic"], jetbrains: ["MARKDOWN_ITALIC"] },
  { name: "underline", color: "voice", style: "underline", scopes: ["markup.underline"] },
  { name: "raw", color: "said", scopes: ["markup.raw", "markup.inline.raw", "markup.math"], jetbrains: ["MARKDOWN_CODE_SPAN"] },
  {
    name: "raw block",
    color: "voice",
    scopes: ["markup.raw.block", "markup.raw.code-fence", "markup.fenced_code.block"],
    jetbrains: ["MARKDOWN_CODE_BLOCK", "MARKDOWN_CODE_FENCE"],
  },
  {
    name: "link",
    color: "aside",
    scopes: ["string.other.link", "meta.link", "meta.image", "constant.other.reference.link"],
    jetbrains: ["MARKDOWN_LINK_TEXT", "MARKDOWN_LINK_LABEL", "MARKDOWN_LINK_DEFINITION", "MARKDOWN_REFERENCE_LINK", "MARKDOWN_EXPLICIT_LINK", "MARKDOWN_IMAGE"],
  },
  {
    name: "link address",
    color: "aside",
    style: "underline",
    scopes: ["markup.underline.link"],
    jetbrains: ["MARKDOWN_LINK_DESTINATION", "MARKDOWN_AUTO_LINK"],
  },
  { name: "quote", color: "whisper", scopes: ["markup.quote"], jetbrains: ["MARKDOWN_BLOCK_QUOTE", "MARKDOWN_BLOCK_QUOTE_MARKER"] },
  {
    name: "list",
    color: "murmur",
    scopes: ["markup.list punctuation", "punctuation.definition.list_item", "punctuation.definition.list.begin"],
    jetbrains: ["MARKDOWN_LIST_MARKER"],
  },
  { name: "inserted", color: "grown", scopes: ["markup.inserted", "meta.diff.header.to-file", "punctuation.definition.inserted"] },
  { name: "deleted", color: "sharp", scopes: ["markup.deleted", "meta.diff.header.from-file", "punctuation.definition.deleted"] },
  { name: "changed", color: "flat", scopes: ["markup.changed", "punctuation.definition.changed"] },
  { name: "diff range", color: "murmur", scopes: ["meta.diff.range", "meta.diff.index", "meta.separator"] },
  { name: "invalid", color: "sharp", scopes: ["invalid"], jetbrains: ["DEFAULT_INVALID_STRING_ESCAPE", "BAD_CHARACTER"] },
  { name: "log info", color: "cue", scopes: ["log.info", "markup.info"], jetbrains: ["LOG_INFO_OUTPUT"] },
  { name: "log debug", color: "nudge", scopes: ["log.debug"], jetbrains: ["LOG_DEBUG_OUTPUT", "LOG_VERBOSE_OUTPUT"] },
  { name: "log warning", color: "flat", scopes: ["log.warning", "markup.warning"], jetbrains: ["LOG_WARNING_OUTPUT"] },
  { name: "log error", color: "sharp", scopes: ["log.error", "markup.error"], jetbrains: ["LOG_ERROR_OUTPUT"] },
] as const satisfies readonly Entry[];

export type RoleName = (typeof table)[number]["name"];
type Role = Entry & { name: RoleName };
export type Rule = { name: RoleName; color: string; style?: Style; scopes: readonly string[] };
type Selector = { selector: string; color: string; style?: Style };

export const syntax: readonly Role[] = table;

const styled = (style?: Style) => (style ? { style } : {});

export function rules(colors: Colors): Rule[] {
  return syntax.map(({ name, color, style, scopes }) => ({ name, color: colors[color], scopes, ...styled(style) }));
}

export function semantics(colors: Colors): Selector[] {
  return syntax.flatMap(({ color, style, semantic = [] }) => semantic.map((selector) => ({ selector, color: colors[color], ...styled(style) })));
}
