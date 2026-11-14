package dev.steelesh.sotto.icons

import com.intellij.openapi.components.BaseState
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.SettingsCategory
import com.intellij.openapi.components.SimplePersistentStateComponent
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.openapi.components.service

@Service(Service.Level.APP)
@State(name = "SottoIcons", storages = [Storage("sotto-icons.xml")], category = SettingsCategory.UI)
internal class SottoIconsSettings : SimplePersistentStateComponent<SottoIconsSettings.Options>(Options()) {
    class Options : BaseState() {
        var variant by enum(Variant.COLOR)
    }

    var variant: Variant
        get() = state.variant
        set(value) {
            state.variant = value
        }
}

internal fun settings(): SottoIconsSettings = service()
