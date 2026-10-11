import org.gradle.api.tasks.testing.Test
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.detekt)
    alias(libs.plugins.kover)
}

val localProperties =
    Properties().apply {
        val file = rootProject.file("local.properties")
        if (file.exists()) {
            file.inputStream().use(::load)
        }
    }
val clerkPublishableKey = clerkPublishableKey(localProperties)
if (!clerkPublishableKey.startsWith("pk_")) {
    throw GradleException("Set CLERK_PUBLISHABLE_KEY in android/local.properties or the environment")
}

android {
    namespace = "app.smarttap"
    compileSdk =
        libs.versions.compileSdk
            .get()
            .toInt()

    defaultConfig {
        applicationId = "app.smarttap"
        minSdk =
            libs.versions.minSdk
                .get()
                .toInt()
        targetSdk =
            libs.versions.compileSdk
                .get()
                .toInt()
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "CLERK_PUBLISHABLE_KEY", "\"$clerkPublishableKey\"")
        buildConfigField("String", "TAP_ORIGIN", "\"https://smart-tap-woad.vercel.app\"")
    }

    buildTypes {
        debug {
            // The emulator's view of the dev server on this machine.
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")
        }
        release {
            buildConfigField("String", "API_BASE_URL", "\"https://smart-tap-woad.vercel.app\"")
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    lint {
        warningsAsErrors = true
        abortOnError = true
        checkTestSources = true
        // Version-bump notices would fail the build whenever a library ships.
        disable += setOf("GradleDependency", "NewerVersionAvailable", "AndroidGradlePluginVersion")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
        allWarningsAsErrors.set(true)
    }
}

fun clerkPublishableKey(localProperties: Properties): String {
    val configured =
        localProperties.getProperty("CLERK_PUBLISHABLE_KEY")?.trim()
            ?: providers.environmentVariable("CLERK_PUBLISHABLE_KEY").orNull?.trim()
    if (!configured.isNullOrEmpty()) {
        return configured
    }
    val envFile = rootProject.file("../.env.local")
    if (!envFile.exists()) {
        return ""
    }
    return envFile
        .readLines()
        .firstNotNullOfOrNull { line ->
            val trimmed = line.trim()
            if (!trimmed.startsWith("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=")) {
                null
            } else {
                trimmed
                    .substringAfter("=")
                    .trim()
                    .trim('"')
                    .trim('\'')
            }
        }.orEmpty()
}

dependencies {
    implementation(platform(libs.compose.bom))
    implementation(libs.activity.compose)
    implementation(libs.lifecycle.runtime.compose)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons)
    implementation(libs.clerk.android.ui)
    implementation(libs.zxing.core)
    testImplementation(libs.junit)
    testImplementation(libs.coroutines.test)
    testImplementation(libs.org.json)
    androidTestImplementation(platform(libs.compose.bom))
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.espresso.core)
    androidTestImplementation(libs.compose.ui.test.junit4)
    debugImplementation(libs.compose.ui.test.manifest)
}

tasks.withType<Test>().configureEach {
    val jsonJars = classpath.filter { it.name.startsWith("json-") }
    val rest = classpath.filter { !it.name.startsWith("json-") }
    setClasspath(jsonJars + rest)
}

detekt {
    buildUponDefaultConfig = true
    config.setFrom(rootProject.file("detekt.yml"))
}

kover {
    reports {
        filters {
            excludes {
                classes("*.BuildConfig", "*ComposableSingletons*")
                // Screens and the Android/Clerk wiring run in device tests, not JVM unit tests.
                packages("app.smarttap.ui")
                classes(
                    "app.smarttap.MainActivity*",
                    "app.smarttap.SmartTapApp",
                    "app.smarttap.SessionKt*",
                    "app.smarttap.MainViewModel\$Companion*",
                )
            }
        }
        verify {
            rule {
                minBound(85)
            }
        }
    }
}
