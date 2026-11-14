package dev.steelesh.sotto.icons

import com.intellij.ide.projectView.ProjectView
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.options.BoundConfigurable
import com.intellij.openapi.project.ProjectManager
import com.intellij.openapi.ui.DialogPanel
import com.intellij.ui.IconDeferrer
import com.intellij.ui.dsl.builder.bind
import com.intellij.ui.dsl.builder.panel

internal class SottoIconsConfigurable : BoundConfigurable(SottoIconsBundle.message("settings.title")) {
    override fun createPanel(): DialogPanel {
        val options = settings()
        return panel {
            buttonsGroup(SottoIconsBundle.message("settings.style")) {
                row { radioButton(SottoIconsBundle.message("settings.style.color"), Variant.COLOR) }
                row { radioButton(SottoIconsBundle.message("settings.style.quiet"), Variant.QUIET) }
            }.bind(options::variant)
        }
    }

    override fun apply() {
        val before = settings().variant
        super.apply()
        if (settings().variant != before) refresh()
    }

    private fun refresh() {
        IconDeferrer.getInstance().clearCache()
        for (project in ProjectManager.getInstance().openProjects) {
            ProjectView.getInstance(project).refresh()
            val editors = FileEditorManager.getInstance(project)
            for (file in editors.openFiles) editors.updateFilePresentation(file)
        }
    }
}
