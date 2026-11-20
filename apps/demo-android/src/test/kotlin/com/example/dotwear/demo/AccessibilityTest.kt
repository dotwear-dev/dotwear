// デモアプリの全画面を巡り、各画面で auditSemantics（読み上げる名前・タップ領域）を確かめる。
// Robolectric の上では ATF が動かないので、本物の ATF は androidTest（エミュレーター）で動かす（SemanticsAudit.kt を参照）。
// 標準の文字の大きさと、文字を 2 倍にした状態の両方で行う（iOS の AccessibilityTests と同じ考え方）。
// フェーズ 3 の受け入れ条件「TalkBack が標準のコンポーネントと同じように動く」を自動で確かめる部分。実機での TalkBack は手で確かめる
package com.example.dotwear.demo

import androidx.activity.ComponentActivity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class AccessibilityTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private fun walkAllScreens() {
        compose.setContent { DemoApp() }

        // ログイン
        compose.auditSemantics("ログイン")
        compose.onNodeWithTag("email", useUnmergedTree = true).performClick()
        compose.onNode(hasText("メールアドレスを入力") or hasEditableTextLabel("メールアドレス")).performTextInput("taro@example.com")
        compose.onNodeWithTag("login").performClick()
        compose.mainClock.advanceTimeBy(1500)

        // 一覧
        compose.auditSemantics("一覧")
        compose.onNodeWithTag("order-A-1024").assertIsDisplayed().performClick()

        // 詳細
        compose.onNodeWithTag("delete").performScrollTo().assertIsDisplayed()
        compose.auditSemantics("詳細")
        compose.onNodeWithText("戻る").performClick()

        // 設定
        compose.onNodeWithTag("settings").performClick()
        compose.onNodeWithTag("push").assertIsDisplayed().performClick()
        compose.auditSemantics("設定")
    }

    @Test
    fun auditDefaultFontScale() = walkAllScreens()

    @Test
    @Config(fontScale = 2.0f)
    fun auditLargeFontScale() = walkAllScreens()

    /** スイッチ・チェックボックスが、標準と同じ役割（Switch / Checkbox）と状態（オン・オフ）で伝わること */
    @Test
    fun togglesExposeRoleAndState() {
        compose.setContent { DemoApp(startLoggedIn = true) }
        compose.onNodeWithTag("settings").performClick()
        val push = compose.onNodeWithTag("push")
        push.assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Switch))
        push.assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, ToggleableState.On))
        push.performClick()
        push.assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, ToggleableState.Off))
        compose.onNode(hasText("週次レポートをメールで受け取る"))
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Checkbox))
    }

    private fun hasEditableTextLabel(label: String) =
        SemanticsMatcher.expectValue(SemanticsProperties.ContentDescription, listOf(label))
}
