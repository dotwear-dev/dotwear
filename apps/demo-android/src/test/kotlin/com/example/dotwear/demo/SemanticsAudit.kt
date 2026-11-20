// Robolectric の上では Google の Accessibility Test Framework（ATF）が動かない（2026-11-17 に確かめた：
// 10dp でラベルのない押せる箱でも検査が失敗しなかった）。そこで JVM では、Compose の semantics の木から
// ATF の主な検査に当たることを自分で確かめる。本物の ATF はエミュレーターの androidTest で動かす
package com.example.dotwear.demo

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.isRoot
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.unit.Density
import org.junit.Assert.fail

/**
 * 押せる部品・切り替えられる部品のすべてについて確かめる：
 *   - 読み上げる名前がある（文字・contentDescription のどちらか。ATF の SpeakableTextPresentCheck に当たる）
 *   - タップ領域が 48dp 以上（ATF の TouchTargetSizeCheck に当たる。見た目より大きい領域も含める）
 */
fun ComposeTestRule.auditSemantics(screen: String) {
    val problems = mutableListOf<String>()
    val density: Density = this.density
    fun visit(node: SemanticsNode) {
        val c = node.config
        val actionable = SemanticsActions.OnClick in c || SemanticsProperties.ToggleableState in c
        // 画面の外（スクロールで隠れている）部品は大きさが 0 になるので調べない（ATF も見えている部品だけを調べる）
        val visible = !node.boundsInRoot.isEmpty
        if (actionable && visible && c.getOrNull(SemanticsProperties.Disabled) == null) {
            val text = c.getOrNull(SemanticsProperties.Text).orEmpty().joinToString { it.text } +
                c.getOrNull(SemanticsProperties.ContentDescription).orEmpty().joinToString() +
                c.getOrNull(SemanticsProperties.EditableText)?.text.orEmpty()
            if (text.isBlank()) problems += "$screen: 読み上げる名前がない（${node.boundsInRoot}）"
            val touch = node.touchBoundsInRoot
            val minPx = with(density) { 48f * this.density } - 0.5f
            if (touch.width < minPx || touch.height < minPx) {
                problems += "$screen: タップ領域が 48dp より小さい（$text, ${touch.width}×${touch.height}px）"
            }
        }
        node.children.forEach(::visit)
    }
    // 統合された木（TalkBack が読む単位）で調べる
    onAllNodes(isRoot()).fetchSemanticsNodes().forEach(::visit)
    if (problems.isNotEmpty()) fail(problems.joinToString("\n"))
}
