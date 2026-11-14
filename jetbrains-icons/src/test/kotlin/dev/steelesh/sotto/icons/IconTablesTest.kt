package dev.steelesh.sotto.icons

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class IconTablesTest {
    private val tables = IconTables.bundled()

    @Test
    fun `every conformance case resolves to the icon vs code shows`() {
        val cases = resource("/conformance.tsv").lines().filter(String::isNotEmpty).map { it.split('\t') }
        assertTrue("the fixture is unexpectedly small: ${cases.size}", cases.size > 10_000)
        val wrong = cases.mapNotNull { (kind, parent, name, expected) ->
            val actual = if (kind == "file") tables.file(parent.ifEmpty { null }, name) else tables.folder(parent.ifEmpty { null }, name)
            if (actual.orEmpty() == expected) null else "$kind $parent/$name: expected '$expected' but resolved '${actual.orEmpty()}'"
        }
        assertEquals(wrong.take(20).joinToString("\n"), 0, wrong.size)
    }

    @Test
    fun `names match whole and extensions match the longest suffix`() {
        assertEquals("npm", tables.file("project", "package.json"))
        assertEquals("npm", tables.file(null, "PACKAGE.JSON"))
        assertEquals("docker", tables.file("project", "Dockerfile"))
        assertEquals("go", tables.file("project", "retry.go"))
        assertEquals("github-actions", tables.file("workflows", "ci.yml"))
        assertNull(tables.file("project", "unclaimed.zzzzzz"))
        assertNull(tables.file("project", "noextension"))
    }

    @Test
    fun `a folder is matched by its whole name and its direct parent`() {
        assertEquals("github", tables.folder("project", ".github"))
        assertEquals("github-actions", tables.folder(".github", "workflows"))
        assertNull(tables.folder("project", "nothing-claims-this"))
        assertNull(tables.folder("project", "src.old"))
    }

    @Test
    fun `every icon the tables name is packaged in both styles with a sixteen pixel box`() {
        val box = Regex("""<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">""")
        for (variant in Variant.entries) {
            for ((kind, icons) in listOf("files" to tables.fileIcons, "folders" to tables.folderIcons)) {
                for (icon in icons) {
                    val path = iconPath(variant, kind, icon)
                    val stream = javaClass.getResourceAsStream(path)
                    assertNotNull("missing $path", stream)
                    val svg = stream!!.bufferedReader().use { it.readText() }
                    assertTrue("$path has no sixteen pixel view box", box.containsMatchIn(svg))
                }
            }
        }
    }

    @Test
    fun `the plugin ships its license and the notice for the icon sets`() {
        assertTrue(resource("/LICENSE").contains("MIT License"))
        assertTrue(resource("/NOTICE").contains("Simple Icons"))
    }

    private fun resource(path: String): String =
        (javaClass.getResourceAsStream(path) ?: error("missing $path")).bufferedReader().use { it.readText() }
}
