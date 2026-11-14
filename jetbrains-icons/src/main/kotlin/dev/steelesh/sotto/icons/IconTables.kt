package dev.steelesh.sotto.icons

import java.util.Locale

internal class IconTables(
    private val fileNames: Map<String, String>,
    private val fileExtensions: Map<String, String>,
    private val folderNames: Map<String, String>,
    order: List<String>,
) {
    private val rank = order.withIndex().associate { (index, icon) -> icon to index }
    private val ranks = order.size.coerceAtLeast(1)

    val fileIcons: Set<String> = (fileNames.values + fileExtensions.values).toSet()
    val folderIcons: Set<String> = folderNames.values.toSet()

    fun file(parent: String?, file: String): String? {
        val name = shape(file)
        val above = parent?.takeIf(String::isNotEmpty)?.let(::shape)
        val segments = name.split('.')
        val short = name.length <= LONGEST_NAME
        var winner: String? = null
        var high = -1L

        fun offer(icon: String?, score: Int) {
            if (icon == null) return
            val total = score.toLong() * ranks + (rank[icon] ?: 0)
            if (total > high) {
                winner = icon
                high = total
            }
        }

        if (short) {
            for (index in 1 until segments.size) {
                val extension = segments.subList(index, segments.size).joinToString(".")
                val length = segments.size - index
                offer(fileExtensions[extension], length + 3)
                if (above != null) offer(fileExtensions["$above/$extension"], length + 4)
            }
        }
        if (short || segments.size == 1) {
            offer(fileNames[name], segments.size + 4)
            if (above != null) offer(fileNames["$above/$name"], segments.size + 5)
        }
        return winner
    }

    fun folder(parent: String?, folder: String): String? {
        val name = shape(folder)
        val above = parent?.takeIf(String::isNotEmpty)?.let(::shape)
        return above?.let { folderNames["$it/$name"] } ?: folderNames[name]
    }

    companion object {
        private const val LONGEST_NAME = 255
        private const val BASE = "/sotto/icons"

        fun bundled(): IconTables = IconTables(
            pairs("file-names.tsv"),
            pairs("file-extensions.tsv"),
            pairs("folder-names.tsv"),
            rows("order.tsv"),
        )

        private fun shape(text: String): String {
            val lower = text.lowercase(Locale.ROOT)
            if (lower.none(::blank)) return lower
            return buildString(lower.length) { for (char in lower) append(if (blank(char)) '/' else char) }
        }

        private fun blank(char: Char): Boolean = Character.isWhitespace(char) || Character.isSpaceChar(char) || char == '﻿'

        private fun rows(table: String): List<String> {
            val stream = IconTables::class.java.getResourceAsStream("$BASE/$table") ?: error("missing icon table $table")
            return stream.bufferedReader(Charsets.UTF_8).useLines { lines -> lines.filter(String::isNotEmpty).toList() }
        }

        private fun pairs(table: String): Map<String, String> = rows(table).associate { row ->
            val at = row.indexOf('\t')
            row.substring(0, at) to row.substring(at + 1)
        }
    }
}
