// dev.dotwear:dotwear-icons … アイコンだけのモジュール（ADR-009）。Compose UI だけに依存し、Material 3 には依存しない
plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.maven.publish)
}

android {
    namespace = "dev.dotwear.icons"
    compileSdk = 37
    defaultConfig {
        minSdk = 24
    }
    sourceSets {
        // ジェネレーターが出す Kotlin（アイコンの定義・パレット）と、テスト用の元データのマス目
        getByName("main").kotlin.srcDir("src/generated/kotlin")
        getByName("test").kotlin.srcDir("src/testGenerated/kotlin")
    }
    testOptions {
        unitTests.isIncludeAndroidResources = true
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(platform(libs.compose.bom))
    api(libs.compose.ui)
    api(libs.compose.ui.graphics)
    implementation(libs.compose.foundation)

    testImplementation(libs.junit)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.ext.junit)
    testImplementation(platform(libs.compose.bom))
    testImplementation(libs.compose.ui.test.junit4)
    debugImplementation(libs.compose.ui.test.manifest)
}

// Maven Central への公開（dev.dotwear:dotwear-icons）。共通の情報は gradle.properties の GROUP・POM_*
mavenPublishing {
    coordinates(artifactId = "dotwear-icons")
    pom {
        name.set("Dotwear Icons")
        description.set("Pixel-perfect pixel-art icons for Jetpack Compose (no Material 3 dependency)")
    }
    publishToMavenCentral()
    // 署名は鍵があるときだけ行う（手元や dry-run の publishToMavenLocal では鍵がないため）。
    // CI の本番の公開では ORG_GRADLE_PROJECT_signingInMemoryKey などで鍵を渡す。
    // secrets が未設定だと空の文字列が渡されるので、「あるか」ではなく「空でないか」で判断する
    if (!providers.gradleProperty("signingInMemoryKey").orNull.isNullOrBlank()) {
        signAllPublications()
    }
}
