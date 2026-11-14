import { readFileSync } from "node:fs";
import meta from "../../package.json" with { type: "json" };
import { alpha, cover } from "../color.ts";
import { notice } from "../icons/notice.ts";
import { faint, half, wash } from "../opacity.ts";
import { type Palette, slots } from "../palette.ts";
import { rules, type Style, semantics } from "../syntax.ts";
import type { Target } from "../target.ts";
import { json } from "../text.ts";
import { type Variant, variants } from "../variant.ts";
import { iconThemes, vscodeIcons } from "./vscode-icons.ts";

type Paint = [color: string, ...ids: string[]];

const hues = ["Black", "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White"];
const terminal = [...hues.map((hue) => `terminal.ansi${hue}`), ...hues.map((hue) => `terminal.ansiBright${hue}`)];
const six = "{1,2,3,4,5,6}";

function expand(pattern: string): string[] {
  const open = pattern.indexOf("{");
  if (open === -1) return [pattern];
  const close = pattern.indexOf("}", open);
  return pattern
    .slice(open + 1, close)
    .split(",")
    .flatMap((part) => expand(pattern.slice(0, open) + part + pattern.slice(close + 1)));
}

function areas(palette: Palette): Record<string, Paint[]> {
  const c = palette.colors;
  const clear = alpha(c.pitch, 0);
  const shadow = alpha(c.pitch, half);
  const veil = (target: string, under = c.still) => alpha(c.voice, cover(c.voice, target, under));
  const settle = (strong: string, target: string) => alpha(strong, cover(strong, target, c.still));
  const added = settle(c.tint_add_strong, c.tint_add);
  const removed = settle(c.tint_delete_strong, c.tint_delete);
  const addedWord = alpha(c.tint_add_strong, wash);
  const removedWord = alpha(c.tint_delete_strong, wash);
  const changed = alpha(c.tint_change, wash);
  const match = alpha(c.tint_search, wash);

  return {
    base: [
      [c.voice, "foreground"],
      [c.whisper, "descriptionForeground"],
      [c.breath, "disabledForeground"],
      [c.sharp, "errorForeground"],
      [c.murmur, "focusBorder", "icon.foreground", "sash.hoverBorder"],
      [c.trace, "widget.border", "textBlockQuote.border", "textSeparator.foreground"],
      [c.trace, "{simpleFindWidget,profiles,settings,chatManagement,aiCustomizationManagement}.sashBorder"],
      [c.held, "selection.background", "toolbar.activeBackground", "actionBar.toggledBackground"],
      [c.near, "toolbar.hoverBackground"],
      [c.lull, "text{BlockQuote,CodeBlock,Preformat}.background", "textPreformat.border"],
      [c.aside, "textLink.{foreground,activeForeground}"],
      [c.said, "textPreformat.foreground"],
      [c.call, "progressBar.background"],
      [shadow, "widget.shadow"],
      [clear, "toolbar.hoverOutline", "scrollbar.shadow"],
      [alpha(c.trace, faint), "{scrollbarSlider,minimapSlider,notebookScrollbarSlider}.background"],
      [alpha(c.trace, half), "{scrollbarSlider,minimapSlider,notebookScrollbarSlider}.hoverBackground"],
      [alpha(c.trace, wash), "{scrollbarSlider,minimapSlider,notebookScrollbarSlider}.activeBackground"],
    ],
    modern: [
      [c.pitch, "surface.background", "modernEditorTab.inactiveBackground", "modernActivityBar.{background,inactiveBackground}"],
      [c.pitch, "modernUI.{shellBackground,inactiveShellBackground}"],
      [c.still, "modernEditorTab.{active,activeHover}{Background,ActionBackground}"],
      [c.lull, "modern{Tab,EditorTab,ActivityBarItem}.hoverBackground", "modernEditorTab.{hover,selected}ActionBackground"],
      [c.near, "modern{Tab,ActivityBarItem}.activeBackground"],
      [c.voice, "surface.foreground", "modern{Tab,EditorTab,ActivityBarItem}.{active,hover}Foreground"],
      [c.trace, "{surface,editor,modernPanel,modernActivityBar}.border", "modernSash.gripForeground"],
    ],
    controls: [
      [c.voice, "{button,checkbox,dropdown,input,badge}.foreground", "button.secondaryForeground"],
      [c.voice, "{radio,inputOption}.activeForeground", "inputValidation.{error,warning,info}Foreground"],
      [c.murmur, "radio.{activeBorder,inactiveForeground}", "{keybindingLabel,gauge}.foreground"],
      [c.breath, "checkbox.disabled.foreground", "input.placeholderForeground"],
      [c.held, "button.hoverBackground", "inputOption.{activeBackground,activeBorder}", "badge.background"],
      [c.near, "button.{background,secondaryHoverBackground}", "checkbox.selectBackground"],
      [c.near, "radio.{activeBackground,inactiveHoverBackground}", "inputOption.hoverBackground"],
      [c.lull, "button.secondaryBackground", "{checkbox,input,keybindingLabel}.background", "input.border"],
      [c.lull, "radio.inactiveBackground", "keybindingTable.headerBackground", "gauge.{background,warningBackground,errorBackground}"],
      [c.room, "checkbox.disabled.background", "dropdown.{background,listBackground}"],
      [c.room, "inputValidation.{error,warning,info}Background", "keybindingTable.rowsBackground"],
      [c.trace, "{button,checkbox,dropdown,keybindingLabel,gauge}.border", "button.{separator,secondaryBorder}"],
      [c.trace, "checkbox.selectBorder", "radio.inactiveBorder", "keybindingLabel.bottomBorder"],
      [c.sharp, "inputValidation.errorBorder", "gauge.errorForeground"],
      [c.flat, "inputValidation.warningBorder", "gauge.warningForeground"],
      [c.cue, "inputValidation.infoBorder"],
    ],
    lists: [
      [c.voice, "list.{activeSelection,inactiveSelection}{Foreground,IconForeground}", "list.{focus,hover}Foreground"],
      [c.breath, "list.deemphasizedForeground"],
      [c.call, "list.{highlightForeground,focusHighlightForeground,dropBetweenBackground}"],
      [c.near, "list.{activeSelection,focus,drop}Background"],
      [c.lull, "list.{inactiveSelection,inactiveFocus,hover}Background"],
      [c.room, "listFilterWidget.background", "tree.tableOddRowsBackground"],
      [c.trace, "listFilterWidget.outline", "tree.{indentGuidesStroke,inactiveIndentGuidesStroke,tableColumnsBorder}"],
      [c.sharp, "list.{invalidItem,error}Foreground", "listFilterWidget.noMatchesOutline"],
      [c.flat, "list.warningForeground"],
      [match, "list.filterMatchBackground"],
      [clear, "list.{focusOutline,focusAndSelectionOutline,inactiveFocusOutline,filterMatchBorder}", "listFilterWidget.shadow"],
    ],
    "activity bar": [
      [c.pitch, "{activityBar,activityBarTop}.background", "activity{Warning,Error}Badge.foreground"],
      [c.voice, "{activityBar,activityBarTop,activityBarBadge,profileBadge}.foreground"],
      [c.whisper, "{activityBar,activityBarTop}.inactiveForeground"],
      [c.call, "activityBar.{activeBorder,activeFocusBorder,dropBorder}", "activityBarTop.{activeBorder,dropBorder}"],
      [c.held, "{activityBarBadge,profileBadge}.background"],
      [c.pitch, "activityBar.border"],
      [c.flat, "activityWarningBadge.background"],
      [c.sharp, "activityErrorBadge.background"],
    ],
    "side bar and panel": [
      [c.room, "{sideBar,sideBarTitle,sideBarSectionHeader,sideBarStickyScroll}.background"],
      [c.pitch, "{panel,panelSectionHeader,panelStickyScroll,outputView,outputViewStickyScroll}.background"],
      [c.murmur, "sideBar.foreground"],
      [c.voice, "panelTitle.activeForeground", "panelTitleBadge.foreground"],
      [c.whisper, "panelTitle.inactiveForeground"],
      [c.call, "{sideBarTitle,sideBarSectionHeader,panelSectionHeader}.foreground", "panel.dropBorder", "panelTitle.activeBorder"],
      [c.held, "panelTitleBadge.background"],
      [c.room, "{sideBar,sideBarActivityBarTop,sideBarStickyScroll}.border"],
      [c.lull, "sideBarSectionHeader.border"],
      [c.trace, "{panel,panelTitle,panelInput,panelSection,panelSectionHeader,panelStickyScroll}.border"],
      [veil(c.near, c.pitch), "{sideBar,panelSection}.dropBackground"],
      [clear, "{sideBar,panel}StickyScroll.shadow"],
    ],
    "editor groups and tabs": [
      [c.still, "editorGroup.emptyBackground", "editorGroupHeader.noTabsBackground", "{editorPane,breadcrumb}.background"],
      [c.still, "tab.{active,unfocusedActive}{Background,Border}"],
      [c.pitch, "editorGroupHeader.tabsBackground", "tab.{inactiveBackground,unfocusedInactiveBackground,border}"],
      [c.lull, "tab.{hover,unfocusedHover,selected}Background"],
      [c.room, "editorGroup.dropIntoPromptBackground", "breadcrumbPicker.background"],
      [c.voice, "editorGroup.dropIntoPromptForeground", "tab.{active,hover,selected}Foreground"],
      [c.voice, "breadcrumb.{focus,activeSelection}Foreground"],
      [c.murmur, "tab.{unfocusedActive,unfocusedHover}Foreground", "tab.selectedBorderTop", "breadcrumb.foreground"],
      [c.whisper, "tab.inactiveForeground"],
      [c.breath, "tab.unfocusedInactiveForeground"],
      [c.call, "tab.{activeBorderTop,dragAndDropBorder}"],
      [c.flat, "tab.{active,inactive,unfocusedActive,unfocusedInactive}ModifiedBorder"],
      [c.trace, "editorGroup.{border,focusedEmptyBorder,dropIntoPromptBorder}", "editorGroupHeader.{tabsBorder,border}"],
      [c.trace, "sideBySideEditor.{horizontal,vertical}Border", "tab.{lastPinnedBorder,unfocusedActiveBorderTop}"],
      [veil(c.near), "editorGroup.dropBackground"],
    ],
    "status bar": [
      [c.pitch, "statusBar.{background,noFolderBackground}", "statusBarItem.{error,warning}Background"],
      [c.lull, "statusBarItem.{prominent,remote,offline}Background"],
      [c.near, "statusBar.debuggingBackground", "statusBarItem.{hover,prominentHover,remoteHover,errorHover,warningHover,offlineHover}Background"],
      [c.held, "statusBarItem.{active,compactHover}Background"],
      [c.murmur, "statusBar.{foreground,focusBorder}", "statusBarItem.focusBorder"],
      [c.voice, "statusBar.debuggingForeground", "statusBarItem.{hover,prominent,prominentHover,remote,remoteHover}Foreground"],
      [c.whisper, "statusBar.noFolderForeground"],
      [c.sharp, "statusBarItem.{error,errorHover}Foreground"],
      [c.flat, "statusBarItem.{warning,warningHover,offline,offlineHover}Foreground"],
      [c.trace, "statusBar.{border,debuggingBorder,noFolderBorder}"],
    ],
    "title bar and menus": [
      [c.pitch, "titleBar.{active,inactive}Background"],
      [c.room, "menu.background"],
      [c.lull, "commandCenter.background"],
      [c.near, "{menubar,menu}.selectionBackground", "commandCenter.{active,debugging}Background"],
      [c.voice, "menu.foreground", "{menubar,menu}.selectionForeground", "commandCenter.activeForeground"],
      [c.murmur, "titleBar.activeForeground", "commandCenter.{foreground,activeBorder}"],
      [c.whisper, "{titleBar,commandCenter}.inactiveForeground"],
      [c.trace, "{titleBar,menu,commandCenter}.border", "menu.separatorBackground", "commandCenter.inactiveBorder"],
    ],
    editor: [
      [c.still, "{editor,editorGutter,minimap,editorStickyScroll,editorStickyScrollGutter}.background"],
      [c.room, "editor.{lineHighlight,inactiveLineHighlight}Background"],
      [c.lull, "editorStickyScrollHover.background"],
      [c.held, "editor.selectionBackground", "editorBracketMatch.background"],
      [c.voice, "editor.{foreground,findMatchHighlightForeground}"],
      [c.whisper, "search.resultsInfoForeground", "editor.foldPlaceholderForeground"],
      [c.breath, "editorLineNumber.{foreground,dimmedForeground}", "editor.{placeholder.foreground,inlineValuesForeground}"],
      [c.breath, "editorInlayHint.{foreground,typeForeground,parameterForeground}", "{editorCodeLens,editorGhostText}.foreground"],
      [c.breath, "editorGutter.foldingControlForeground"],
      [c.call, "editorLineNumber.activeForeground", "editor.findMatchBackground", "editorBracketMatch.foreground"],
      [c.caret, "{editorCursor,editorMultiCursor.primary,editorMultiCursor.secondary}.foreground"],
      [c.pitch, "{editorCursor,editorMultiCursor.primary,editorMultiCursor.secondary}.background", "editor.findMatchForeground"],
      [c.aside, "editorLink.activeForeground"],
      [c.nudge, "{editorLightBulb,editorLightBulbAutoFix,editorLightBulbAi,editorHint}.foreground"],
      [c.sharp, "{editorError,problemsErrorIcon,editorBracketHighlight.unexpectedBracket}.foreground"],
      [c.flat, "{editorWarning,problemsWarningIcon}.foreground", "editorUnicodeHighlight.border"],
      [c.cue, "{editorInfo,problemsInfoIcon}.foreground"],
      [c.murmur, "editor.compositionBorder", `editorBracketHighlight.foreground${six}`],
      [c.murmur, `{editorIndentGuide,editorBracketPairGuide}.activeBackground${six}`],
      [c.trace, `{editorIndentGuide,editorBracketPairGuide}.background${six}`],
      [c.trace, "{editorWhitespace,editorRuler}.foreground", "searchEditor.textInputBorder", "editorStickyScroll.border"],
      [alpha(c.pitch, 0.65), "editorUnnecessaryCode.opacity"],
      [clear, "editor.{lineHighlightBorder,inlineValuesBackground,snippetFinalTabstopHighlightBorder,foldBackground}", "editorBracketMatch.border"],
      [clear, "editorInlayHint.{background,typeBackground,parameterBackground}", "editorStickyScroll.shadow"],
    ],
    "editor highlights": [
      [veil(c.lull), "editor.{findRangeHighlight,rangeHighlight}Background", "editorCommentsWidget.rangeBackground"],
      [veil(c.lull), "editor.{selectionHighlight,wordHighlight,wordHighlightText}Background"],
      [veil(c.near), "editor.{inactiveSelection,wordHighlightStrong,hoverHighlight,symbolHighlight}Background"],
      [veil(c.near), "editor.{linkedEditing,snippetTabstopHighlight}Background", "editorCommentsWidget.rangeActiveBackground"],
      [veil(c.near), "notebook.symbolHighlightBackground"],
      [veil(c.held), "editor.snippetFinalTabstopHighlightBackground"],
      [match, "{editor.findMatchHighlight,searchEditor.findMatch}Background", "{peekViewEditor,peekViewResult}.matchHighlightBackground"],
      [added, "editor.stackFrameHighlightBackground"],
      [changed, "editor.focusedStackFrameHighlightBackground"],
    ],
    "gutter, rulers and minimap": [
      [c.grown, "{editorGutter,minimapGutter}.addedBackground", "editorOverviewRuler.{addedForeground,inlineChatInserted,currentContentForeground}"],
      [c.flat, "{editorGutter,minimapGutter}.modifiedBackground", "editorGutter.commentDraftGlyphForeground", "minimap.warningHighlight"],
      [c.flat, "editorOverviewRuler.{modified,warning,commentDraft,incomingContent}Foreground"],
      [c.sharp, "{editorGutter,minimapGutter}.deletedBackground", "minimap.errorHighlight"],
      [c.sharp, "editorOverviewRuler.{deletedForeground,errorForeground,inlineChatRemoved}"],
      [c.cue, "editorGutter.commentUnresolvedGlyphForeground", "editorCommentsWidget.unresolvedBorder", "minimap.infoHighlight"],
      [c.cue, "editorOverviewRuler.{info,commentUnresolved}Foreground"],
      [c.call, "minimap.findMatchHighlight"],
      [c.voice, "editorGutter.itemGlyphForeground"],
      [c.murmur, "editorGutter.commentGlyphForeground", "minimap.selectionHighlight", "editorOverviewRuler.commonContentForeground"],
      [c.near, "editorGutter.itemBackground"],
      [c.lull, "editorCommentsWidget.replyInputBackground"],
      [c.trace, "editorGutter.{added,modified,deleted}SecondaryBackground", "editorGutter.commentRangeForeground"],
      [c.trace, "editorOverviewRuler.{bracketMatch,comment}Foreground", "editorCommentsWidget.resolvedBorder"],
      [c.trace, "minimap.selectionOccurrenceHighlight"],
      [alpha(c.call, wash), "editorOverviewRuler.findMatchForeground"],
      [alpha(c.trace, wash), "editorOverviewRuler.{rangeHighlight,wordHighlightStrong}Foreground"],
      [alpha(c.trace, half), "editorOverviewRuler.{selectionHighlight,wordHighlight,wordHighlightText}Foreground"],
      [alpha(c.grown, half), "minimap.chatEditHighlight", "editorMinimap.inlineChatInserted"],
      [alpha(c.pitch, 0.75), "minimap.foregroundOpacity"],
      [clear, "editorOverviewRuler.border"],
    ],
    "inline edits": [
      [c.room, "inlineEdit.gutterIndicator.background"],
      [c.lull, "inlineEdit.gutterIndicator.secondaryBackground"],
      [c.near, "inlineEdit.gutterIndicator.{primary,successful}Background"],
      [c.voice, "inlineEdit.gutterIndicator.primaryForeground"],
      [c.murmur, "inlineEdit.gutterIndicator.secondaryForeground", "inlineEdit.tabWillAccept{Original,Modified}Border"],
      [c.grown, "inlineEdit.gutterIndicator.successfulForeground"],
      [c.trace, "inlineEdit.gutterIndicator.{primary,secondary,successful}Border", "inlineEdit.{original,modified}Border"],
      [removed, "inlineEdit.{original,originalChangedLine}Background"],
      [added, "inlineEdit.{modified,modifiedChangedLine}Background"],
      [removedWord, "inlineEdit.originalChangedTextBackground"],
      [addedWord, "inlineEdit.modifiedChangedTextBackground"],
    ],
    "diff and merge": [
      [added, "{diffEditor,diffEditorGutter}.insertedLineBackground", "merge.currentContentBackground", "mergeEditor.conflict.input1.background"],
      [removed, "{diffEditor,diffEditorGutter}.removedLineBackground", "mergeEditor.changeBase.background"],
      [addedWord, "diffEditor.insertedTextBackground", "merge.currentHeaderBackground"],
      [removedWord, "diffEditor.removedTextBackground", "mergeEditor.changeBase.word.background"],
      [changed, "merge.incomingContentBackground", "mergeEditor.{change,conflict.input2}.background"],
      [match, "merge.commonHeaderBackground", "mergeEditor.conflictingLines.background"],
      [veil(c.held), "merge.incomingHeaderBackground", "mergeEditor.change.word.background"],
      [veil(c.lull), "diffEditor.unchangedCodeBackground", "merge.commonContentBackground"],
      [c.grown, "diffEditorOverview.insertedForeground"],
      [c.sharp, "diffEditorOverview.removedForeground"],
      [c.pitch, "multiDiffEditor.background"],
      [c.lull, "diffEditor.unchangedRegionBackground", "multiDiffEditor.headerBackground"],
      [c.whisper, "diffEditor.unchangedRegionForeground"],
      [c.flat, "mergeEditor.conflict.{unhandledUnfocused.border,unhandledFocused.border,unhandled.minimapOverViewRuler}"],
      [c.murmur, "diffEditor.moveActive.border", "mergeEditor.conflict.handledFocused.border"],
      [c.trace, "{diffEditor,diffEditor.move,multiDiffEditor}.border", "diffEditor.diagonalFill"],
      [c.trace, "mergeEditor.conflict.{handledUnfocused.border,handled.minimapOverViewRuler}"],
      [clear, "diffEditor.unchangedRegionShadow", "merge.border"],
    ],
    "source control": [
      [c.grown, "gitDecoration.{added,untracked}ResourceForeground", "scmGraph.historyItemHoverAdditionsForeground"],
      [c.flat, "gitDecoration.{modified,renamed,stageModified}ResourceForeground"],
      [c.sharp, "gitDecoration.{deleted,stageDeleted,conflicting}ResourceForeground", "scmGraph.historyItemHoverDeletionsForeground"],
      [c.breath, "gitDecoration.ignoredResourceForeground", "git.blame.editorDecorationForeground"],
      [c.murmur, "gitDecoration.submoduleResourceForeground"],
      [c.rest, "scmGraph.foreground1"],
      [c.form, "scmGraph.{foreground2,historyItemRefColor}"],
      [c.aside, "scmGraph.{foreground3,historyItemRemoteRefColor}"],
      [c.said, "scmGraph.{foreground4,historyItemBaseRefColor}"],
      [c.nudge, "scmGraph.foreground5"],
      [c.pitch, "scmGraph.historyItemHoverLabelForeground"],
      [c.near, "scmGraph.historyItemHoverDefaultLabelBackground"],
      [c.voice, "scmGraph.historyItemHoverDefaultLabelForeground"],
    ],
    "floating widgets": [
      [c.room, "{editorWidget,editorSuggestWidget,editorHoverWidget,editorMarkerNavigation,editorActionList}.background"],
      [c.room, "editorMarkerNavigation{Error,Warning,Info}.headerBackground"],
      [c.room, "{peekViewEditor,peekViewEditorGutter,peekViewEditorStickyScroll,peekViewEditorStickyScrollGutter}.background"],
      [c.room, "{peekViewResult,peekViewTitle,quickInput,quickInputTitle,notificationCenterHeader,notifications}.background"],
      [c.lull, "editorHoverWidget.statusBarBackground", "banner.background"],
      [c.near, "editorSuggestWidget.selectedBackground", "peekViewResult.selectionBackground"],
      [c.near, "{quickInputList,editorActionList}.focusBackground"],
      [c.voice, "{editorWidget,editorSuggestWidget,editorHoverWidget,editorActionList,quickInput,notifications,banner}.foreground"],
      [c.voice, "editorSuggestWidget.{selectedForeground,selectedIconForeground}", "peekViewResult.{file,selection}Foreground"],
      [c.voice, "quickInputList.{focusForeground,focusIconForeground}", "editorActionList.focusForeground"],
      [c.murmur, "editorWidget.resizeBorder", "peekViewResult.lineForeground"],
      [c.whisper, "{editorSuggestWidgetStatus,peekViewTitleDescription}.foreground"],
      [c.call, "editorSuggestWidget.{highlightForeground,focusHighlightForeground}", "editorHoverWidget.highlightForeground"],
      [c.call, "{peekViewTitleLabel,pickerGroup,notificationCenterHeader}.foreground"],
      [c.aside, "notificationLink.foreground"],
      [c.sharp, "editorMarkerNavigationError.background", "notificationsErrorIcon.foreground"],
      [c.flat, "editorMarkerNavigationWarning.background", "notificationsWarningIcon.foreground"],
      [c.cue, "editorMarkerNavigationInfo.background", "notificationsInfoIcon.foreground", "banner.iconForeground"],
      [c.trace, "{editorWidget,editorSuggestWidget,editorHoverWidget,peekView,pickerGroup}.border"],
      [c.trace, "{notificationCenter,notificationToast,notifications}.border"],
    ],
    "extensions, settings and welcome": [
      [c.still, "welcomePage.background"],
      [c.room, "settings.rowHoverBackground", "welcomePage.tileBackground"],
      [c.lull, "extensionButton.background", "settings.{dropdown,checkbox,textInput,numberInput}Background"],
      [c.lull, "settings.{dropdown,textInput,numberInput}Border", "settings.focusedRowBackground"],
      [c.lull, "welcomePage.{tileHoverBackground,progress.background}", "walkThrough.embeddedEditorBackground"],
      [c.near, "extensionButton.{hover,prominent}Background"],
      [c.held, "extensionButton.prominentHoverBackground", "extensionBadge.remoteBackground"],
      [c.voice, "extensionButton.{foreground,prominentForeground}", "extensionBadge.remoteForeground"],
      [c.voice, "settings.{dropdown,checkbox,textInput,numberInput}Foreground", "walkthrough.stepTitle.foreground"],
      [c.murmur, "extensionIcon.{star,verified,preRelease,sponsor,private}Foreground", "mcpIcon.starForeground"],
      [c.call, "settings.{headerForeground,settingsHeaderHoverForeground}", "welcomePage.progress.foreground"],
      [c.flat, "settings.modifiedItemIndicator"],
      [c.trace, "extensionButton.{separator,border}", "settings.{dropdownListBorder,checkboxBorder,focusedRowBorder,headerBorder}"],
      [c.trace, "welcomePage.tileBorder"],
    ],
    terminal: [
      ...slots(palette, terminal).map(([id, color]): Paint => [color, id]),
      [c.pitch, "{terminal,terminalCursor,terminalStickyScroll}.background"],
      [c.lull, "terminalStickyScrollHover.background"],
      [c.near, "terminal.inactiveSelectionBackground"],
      [c.held, "terminal.selectionBackground"],
      [c.voice, "terminal.foreground"],
      [c.breath, "terminal.initialHintForeground", "terminalCommandDecoration.defaultBackground"],
      [c.caret, "terminalCursor.foreground", "terminalOverviewRuler.cursorForeground"],
      [c.call, "terminal.{findMatchBorder,tab.activeBorder}", "terminalOverviewRuler.findMatchForeground"],
      [c.call, "terminalSymbolIcon.{method,alias,inlineSuggestion,pullRequest}Foreground"],
      [c.aside, "terminalSymbolIcon.{flag,option,argument,branch,tag}Foreground"],
      [c.said, "terminalSymbolIcon.{optionValue,commit,stash}Foreground"],
      [c.form, "terminalSymbolIcon.{folder,symbolicLinkFolder,remote,pullRequestDone}Foreground"],
      [c.murmur, "terminalSymbolIcon.{fileForeground,symbolicLinkFileForeground,symbolText}"],
      [c.grown, "terminalCommandDecoration.successBackground"],
      [c.sharp, "terminalCommandDecoration.errorBackground"],
      [c.trace, "{terminal,terminalStickyScroll}.border", "terminalCommandGuide.foreground"],
      [alpha(c.call, half), "terminal.findMatchBackground"],
      [match, "terminal.findMatchHighlightBackground"],
      [veil(c.near, c.pitch), "terminal.{hoverHighlight,drop}Background"],
      [clear, "terminal.findMatchHighlightBorder", "terminalOverviewRuler.border"],
    ],
    "debug and testing": [
      [c.room, "{debugToolBar,debugExceptionWidget}.background", "testing.{peek,messagePeek}HeaderBackground"],
      [c.near, "debugView.stateLabelBackground"],
      [c.held, "testing.coverCountBadgeBackground"],
      [c.voice, "debugView.stateLabelForeground", "debugTokenExpression.name", "testing.coverCountBadgeForeground"],
      [c.murmur, "debugTokenExpression.value", "debugIcon.{breakpointStackframe,pause,stepOver,stepInto,stepOut,stepBack}Foreground"],
      [c.whisper, "debugIcon.breakpointUnverifiedForeground", "debugConsole.sourceForeground", "testing.iconUnset"],
      [c.breath, "debugIcon.breakpointDisabledForeground", "testing.message.info.decorationForeground"],
      [c.pitch, "debugView.exceptionLabelForeground", "testing.message.error.badgeForeground"],
      [c.call, "debugTokenExpression.boolean", "debugIcon.breakpointCurrentStackframeForeground", "debugConsoleInputIcon.foreground"],
      [c.said, "debugTokenExpression.{string,number}"],
      [c.form, "debugTokenExpression.type"],
      [c.grown, "debugIcon.{start,continue,restart}Foreground", "ports.iconRunningProcessForeground"],
      [c.grown, "testing.{runAction,iconPassed,coveredGutterBackground}"],
      [c.sharp, "debugExceptionWidget.border", "debugView.exceptionLabelBackground", "debugTokenExpression.error"],
      [c.sharp, "debugIcon.{breakpoint,stop,disconnect}Foreground", "debugConsole.errorForeground"],
      [c.sharp, "testing.{iconFailed,iconErrored,uncoveredGutterBackground}", "testing.message.error.{badgeBackground,badgeBorder}"],
      [c.flat, "debugConsole.warningForeground", "testing.iconQueued"],
      [c.cue, "debugConsole.infoForeground", "testing.iconSkipped"],
      [c.tint_change, "debugView.valueChangedHighlight"],
      [c.trace, "debugToolBar.border", "testing.{peekBorder,messagePeekBorder}"],
      [added, "testing.coveredBackground"],
      [removed, "testing.{message.error.line,uncovered}Background"],
      [removedWord, "testing.uncoveredBranchBackground"],
      [clear, "testing.{message.info.lineBackground,coveredBorder,uncoveredBorder}"],
    ],
    "symbols, charts and markdown": [
      [c.call, "symbolIcon.{function,method,boolean,null}Foreground"],
      [c.form, "symbolIcon.{class,interface,struct,enumerator,typeParameter,constructor,event,property,field,key,folder}Foreground"],
      [c.said, "symbolIcon.{string,number,text,color,unit}Foreground", "charts.orange"],
      [c.rest, "symbolIcon.{keyword,snippet}Foreground"],
      [c.voice, "symbolIcon.{variable,constant,enumeratorMember,module,namespace,package}Foreground", "charts.foreground"],
      [c.murmur, "symbolIcon.{operator,array,object,reference,file}Foreground", "chart.line"],
      [c.sharp, "charts.red", "markdownAlert.caution.foreground"],
      [c.flat, "charts.yellow", "markdownAlert.warning.foreground"],
      [c.cue, "charts.blue", "markdownAlert.note.foreground", "commentsView.unresolvedIcon"],
      [c.nudge, "charts.purple", "markdownAlert.important.foreground"],
      [c.grown, "charts.green", "markdownAlert.tip.foreground"],
      [c.breath, "commentsView.resolvedIcon"],
      [c.lull, "chart.guide"],
      [c.trace, "charts.lines", "chart.axis"],
    ],
    notebook: [
      [c.still, "notebook.{editorBackground,outputContainerBackgroundColor}"],
      [c.room, "notebook.{cellHover,focusedCell,selectedCell}Background"],
      [c.lull, "notebook.cellEditorBackground"],
      [c.near, "notebook.cellStatusBarItemHoverBackground"],
      [c.call, "notebook.cellInsertionIndicator"],
      [c.murmur, "notebook.{focusedCellBorder,focusedEditorBorder}"],
      [c.sharp, "notebookStatusErrorIcon.foreground"],
      [c.flat, "notebookStatusRunningIcon.foreground", "notebookEditorOverviewRuler.runningCellForeground"],
      [c.grown, "notebookStatusSuccessIcon.foreground"],
      [c.trace, "notebook.{cellBorderColor,cellToolbarSeparator,outputContainerBorderColor}"],
      [c.trace, "notebook.{inactiveFocusedCell,inactiveSelectedCell,selectedCell}Border"],
    ],
    "chat and agents": [
      [c.pitch, "{agents,inactiveSessionView}.background", "agentsUnreadBadge.foreground"],
      [c.still, "{agentsPanel,activeSessionView}.background"],
      [c.room, "{inlineChat,agentFeedbackEditorWidget}.background"],
      [c.lull, "chat.{requestBackground,requestBubbleBackground,avatarBackground}", "{inlineChatInput,agentsChatInput}.{background,border}"],
      [c.near, "chat.{requestBubbleHover,slashCommand}Background", "agentsNewSessionButton.background"],
      [c.held, "agentsNewSessionButton.hoverBackground", "agentsBadge.background"],
      [c.voice, "chat.{slashCommandForeground,avatarForeground,thinkingShimmer}", "inlineChat.foreground"],
      [c.voice, "{agentsPanel,agentsChatInput,agentsNewSessionButton,agentsBadge,activeSessionView}.foreground"],
      [c.murmur, "interactive.activeCodeBorder", "{inlineChatInput,agentsChatInput}.focusBorder", "inactiveSessionView.foreground"],
      [c.breath, "{inlineChatInput,agentsChatInput}.placeholderForeground"],
      [c.call, "agentsUnreadBadge.background"],
      [c.grown, "chat.linesAddedForeground", "agentsMobileDiff.addedForeground"],
      [c.flat, "chat.editedFileForeground", "agentsMobileDiff.modifiedForeground"],
      [c.sharp, "chat.linesRemovedForeground", "agentsMobileDiff.deletedForeground"],
      [c.trace, "chat.{requestBorder,requestCodeBorder,checkpointSeparator}", "interactive.inactiveCodeBorder"],
      [c.trace, "{inlineChat,agentsPanel,agentsCard,agentsBottomPanel,agentFeedbackEditorWidget}.border"],
      [c.trace, "{agentFeedbackInputWidget,agentsNewSessionButton}.border"],
      [added, "inlineChatDiff.inserted"],
      [removed, "inlineChatDiff.removed"],
      [shadow, "inlineChat.shadow"],
    ],
  };
}

function workbench(palette: Palette): Record<string, string> {
  const colors = new Map<string, string>();
  for (const [area, paints] of Object.entries(areas(palette))) {
    for (const [color, ...patterns] of paints) {
      for (const id of patterns.flatMap(expand)) {
        if (colors.has(id)) throw new Error(`vscode: ${id} is set a second time under ${area}`);
        colors.set(id, color);
      }
    }
  }
  return Object.fromEntries([...colors].sort(([a], [b]) => (a < b ? -1 : 1)));
}

const styled = (color: string, style?: Style) => (style ? { foreground: color, fontStyle: style } : { foreground: color });

const theme = ({ name, palette }: Variant) =>
  json({
    $schema: "vscode://schemas/color-theme",
    name,
    type: "dark",
    semanticHighlighting: true,
    colors: workbench(palette),
    tokenColors: rules(palette.colors).map(({ name, scopes, color, style }) => ({ name, scope: scopes, settings: styled(color, style) })),
    semanticTokenColors: Object.fromEntries(semantics(palette.colors).map(({ selector, color, style }) => [selector, styled(color, style)])),
  });

const asset = (name: string) => `${meta.repository.url}/raw/main/assets/${name}.png`;

const manifest = (palette: Palette) =>
  json({
    name: meta.name,
    displayName: "Sotto",
    description: meta.description,
    version: meta.version,
    publisher: "steelesh",
    license: meta.license,
    repository: meta.repository,
    homepage: meta.homepage,
    bugs: { url: `${meta.repository.url}/issues` },
    engines: { vscode: "^1.100.0" },
    categories: ["Themes"],
    keywords: ["dark", "quiet", "pastel", "muted", "soft", "calm", "minimal", "low-contrast", "oled", "color-theme", "icon-theme", "file-icons"],
    icon: "icon.png",
    galleryBanner: { color: palette.colors.pitch, theme: "dark" },
    contributes: {
      themes: variants(palette).map(({ name, file }) => ({ label: name, uiTheme: "vs-dark", path: `./themes/${file}-color-theme.json` })),
      iconThemes: iconThemes.map(({ id, label }) => ({ id, label, path: `./icons/${id}-icon-theme.json` })),
    },
    files: ["LICENSE", "NOTICE", "icon.png", "themes", "icons"],
  });

export const vscode: Target = {
  name: "vscode",
  files: (palette) => [
    { path: "themes/vscode/package.json", content: manifest(palette) },
    ...vscodeIcons(palette.colors),
    ...variants(palette).map((variant) => ({ path: `themes/vscode/themes/${variant.file}-color-theme.json`, content: theme(variant) })),
    { path: "themes/vscode/LICENSE", content: readFileSync(new URL("../../LICENSE", import.meta.url), "utf8") },
    { path: "themes/vscode/NOTICE", content: notice },
    {
      path: "themes/vscode/README.md",
      content: `![Sotto](${asset("hero")})\n\n# Sotto\n\n${meta.description} See it at [sottotheme.com](${meta.homepage}).\n\nColor themes: Sotto and Sotto Black. File icon themes: Sotto and Sotto Quiet.\n\n![Sotto icons](${asset("icons")})\n`,
    },
  ],
};
