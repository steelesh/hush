package dev.steelesh.sotto.icons

import com.intellij.ide.IconProvider
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.IndexNotReadyException
import com.intellij.psi.PsiDirectory
import com.intellij.psi.PsiElement
import javax.swing.Icon

internal class SottoFolderIconProvider : IconProvider(), DumbAware {
    private val asking = ThreadLocal<Boolean>()

    override fun getIcon(element: PsiElement, flags: Int): Icon? {
        if (element !is PsiDirectory || asking.get() == true) return null
        val directory = element.virtualFile
        val icon = tables.folder(directory.parent?.name, directory.name) ?: return null
        if (claimed(element, flags)) return null
        return folderIcon(icon)
    }

    private fun claimed(directory: PsiDirectory, flags: Int): Boolean {
        asking.set(true)
        try {
            return EXTENSION_POINT_NAME.extensionList.any { other -> other !== this && other.getIcon(directory, flags) != null }
        } catch (_: IndexNotReadyException) {
            return true
        } finally {
            asking.remove()
        }
    }
}
