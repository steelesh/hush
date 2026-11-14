import groovy.json.JsonSlurper
import org.jetbrains.intellij.platform.gradle.TestFrameworkType
import org.jetbrains.intellij.platform.gradle.tasks.VerifyPluginTask
import org.jetbrains.kotlin.gradle.dsl.KotlinVersion
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.jetbrains.kotlin.jvm")
    id("org.jetbrains.intellij.platform")
}

val manifest = providers.fileContents(layout.projectDirectory.file("../package.json")).asText
val themes = layout.projectDirectory.dir("../themes")
val variants = listOf("color", "quiet")

group = "dev.steelesh.sotto"
version = (JsonSlurper().parseText(manifest.get()) as Map<*, *>)["version"] as String

dependencies {
    testImplementation("junit:junit:4.13.2")

    intellijPlatform {
        intellijIdea("2026.1.5.1")
        testFramework(TestFrameworkType.Platform)
    }
}

intellijPlatform {
    pluginVerification {
        failureLevel = listOf(
            VerifyPluginTask.FailureLevel.COMPATIBILITY_PROBLEMS,
            VerifyPluginTask.FailureLevel.INTERNAL_API_USAGES,
            VerifyPluginTask.FailureLevel.OVERRIDE_ONLY_API_USAGES,
            VerifyPluginTask.FailureLevel.NOT_DYNAMIC,
        )
    }
}

tasks {
    withType<KotlinCompile>().configureEach {
        compilerOptions {
            apiVersion = KotlinVersion.KOTLIN_2_3
            languageVersion = KotlinVersion.KOTLIN_2_3
        }
    }

    processResources {
        for (variant in variants) {
            from(themes.dir("vscode/icons/$variant")) {
                exclude("folder.svg", "folder-*.svg")
                into("icons/sotto/$variant/files")
            }
            from(themes.dir("jetbrains-icons/icons/folders/$variant")) {
                into("icons/sotto/$variant/folders")
            }
        }
        from(themes.dir("jetbrains-icons/tables")) {
            into("sotto/icons")
        }
        from(themes.dir("jetbrains-icons")) {
            include("LICENSE", "NOTICE")
        }
        from(themes.file("jetbrains/META-INF/pluginIcon.svg")) {
            into("META-INF")
        }
    }
}
