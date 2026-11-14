package dev.steelesh.sotto.icons

import com.intellij.ide.FileIconProvider
import com.intellij.ide.IconProvider
import com.intellij.psi.PsiDirectory
import com.intellij.testFramework.fixtures.BasePlatformTestCase

class SottoIconProvidersTest : BasePlatformTestCase() {
    private val files get() = FileIconProvider.EP_NAME.extensionList.filterIsInstance<SottoFileIconProvider>().single()
    private val folders get() = IconProvider.EXTENSION_POINT_NAME.extensionList.filterIsInstance<SottoFolderIconProvider>().single()

    fun `test a claimed file name gets its icon and an unclaimed one is left to the ide`() {
        val claimed = myFixture.addFileToProject("web/package.json", "{}").virtualFile
        val unclaimed = myFixture.addFileToProject("web/notes.zzzzzz", "").virtualFile
        assertSame(fileIcon("npm"), files.getIcon(claimed, 0, project))
        assertNull(files.getIcon(unclaimed, 0, project))
        assertNull(files.getIcon(claimed.parent, 0, project))
    }

    fun `test the style setting chooses which drawing is loaded`() {
        val before = settings().variant
        try {
            settings().variant = Variant.COLOR
            val color = fileIcon("npm")
            settings().variant = Variant.QUIET
            assertNotSame(color, fileIcon("npm"))
        } finally {
            settings().variant = before
        }
    }

    fun `test the folder provider answers only for directories and never for a source root`() {
        val file = myFixture.addFileToProject("docs/readme.md", "")
        assertNull(folders.getIcon(file, 0))
        val root: PsiDirectory = file.containingDirectory.parentDirectory!!
        assertNull(folders.getIcon(root, 0))
    }
}
