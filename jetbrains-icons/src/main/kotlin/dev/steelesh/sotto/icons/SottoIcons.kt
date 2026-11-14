package dev.steelesh.sotto.icons

import com.intellij.openapi.util.IconLoader
import java.util.concurrent.ConcurrentHashMap
import javax.swing.Icon

internal val tables: IconTables by lazy(IconTables::bundled)

internal fun iconPath(variant: Variant, kind: String, name: String): String = "/icons/sotto/${variant.folder}/$kind/$name.svg"

internal fun fileIcon(name: String): Icon = load(iconPath(settings().variant, "files", name))

internal fun folderIcon(name: String): Icon = load(iconPath(settings().variant, "folders", name))

private val loaded = ConcurrentHashMap<String, Icon>()

private fun load(path: String): Icon = loaded.computeIfAbsent(path) { IconLoader.getIcon(it, IconTables::class.java.classLoader) }
