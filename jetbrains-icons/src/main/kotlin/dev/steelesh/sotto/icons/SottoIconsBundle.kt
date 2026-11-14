package dev.steelesh.sotto.icons

import com.intellij.DynamicBundle
import org.jetbrains.annotations.Nls
import org.jetbrains.annotations.PropertyKey

private const val BUNDLE = "messages.SottoIconsBundle"

internal object SottoIconsBundle : DynamicBundle(SottoIconsBundle::class.java, BUNDLE) {
    @Nls
    fun message(@PropertyKey(resourceBundle = BUNDLE) key: String, vararg values: Any): String = getMessage(key, *values)
}
