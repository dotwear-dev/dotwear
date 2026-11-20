// dev.dotwear:dotwear-compose … UI 一式のモジュール（:icons に依存し、api で再公開する。ADR-009）
plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.maven.publish)
    alias(libs.plugins.roborazzi)
}

android {
    namespace = "dev.dotwear.compose"
    compileSdk = 37
    defaultConfig {
        minSdk = 24
    }
    sourceSets {
        // ジェネレーターが出す DotwearTokens.kt と、同梱のフォント（res/font）・そのライセンス文（assets/licenses）。ADR-026
        getByName("main").kotlin.srcDir("src/generated/kotlin")
        getByName("main").res.srcDir("src/generated/res")
        getByName("main").assets.srcDir("src/generated/assets")
    }
    testOptions {
        unitTests.isIncludeAndroidResources = true
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    // 利用者が dotwear-compose だけを入れればアイコンも使えるように、api で公開する
    api(project(":icons"))
    implementation(platform(libs.compose.bom))
    api(libs.compose.material3)
    implementation(libs.compose.foundation)

    testImplementation(libs.junit)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.ext.junit)
    testImplementation(platform(libs.compose.bom))
    testImplementation(libs.compose.ui.test.junit4)
    testImplementation(libs.roborazzi)
    testImplementation(libs.roborazzi.compose)
    debugImplementation(libs.compose.ui.test.manifest)
}

// スナップショット（Roborazzi）の保存先。git に入れて、見た目の変化に気づけるようにする
roborazzi {
    outputDir.set(file("src/test/snapshots"))
}

// Maven Central への公開（dev.dotwear:dotwear-compose）。共通の情報は gradle.properties の GROUP・POM_*
mavenPublishing {
    coordinates(artifactId = "dotwear-compose")
    pom {
        name.set("Dotwear Compose")
        description.set("Pixel-style theme and components for Jetpack Compose (includes dotwear-icons)")
    }
    publishToMavenCentral()
    // 署名は鍵があるときだけ行う（手元や dry-run の publishToMavenLocal では鍵がないため）。
    // CI の本番の公開では ORG_GRADLE_PROJECT_signingInMemoryKey などで鍵を渡す。
    // secrets が未設定だと空の文字列が渡されるので、「あるか」ではなく「空でないか」で判断する
    if (!providers.gradleProperty("signingInMemoryKey").orNull.isNullOrBlank()) {
        signAllPublications()
    }
}
