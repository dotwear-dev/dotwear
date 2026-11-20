package com.example.dotwear.demo

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import dev.dotwear.compose.Dotwear
import dev.dotwear.compose.DotwearButton
import dev.dotwear.compose.DotwearButtonSize
import dev.dotwear.compose.DotwearButtonVariant
import dev.dotwear.compose.DotwearCard
import dev.dotwear.compose.DotwearCheckbox
import dev.dotwear.compose.DotwearSwitch
import dev.dotwear.compose.DotwearTextField
import dev.dotwear.icons.DotwearIcon
import dev.dotwear.icons.DotwearIcons
import kotlinx.coroutines.delay

/** 画面の共通の枠：見出しと、戻る・右上の操作 */
@Composable
private fun Page(
    title: String,
    onBack: (() -> Unit)? = null,
    action: (@Composable () -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    Column(
        Modifier.verticalScroll(rememberScrollState()).padding(Dotwear.dots(8)),
        verticalArrangement = Arrangement.spacedBy(Dotwear.dots(6)),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (onBack != null) {
                DotwearButton(onClick = onBack, variant = DotwearButtonVariant.Ghost, size = DotwearButtonSize.Small) { Text("戻る") }
                Spacer(Modifier.padding(Dotwear.dots(2)))
            }
            Text(
                title,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = Dotwear.colors.foreground,
                modifier = Modifier.weight(1f).semantics { heading() },
            )
            action?.invoke()
        }
        content()
    }
}

@Composable
fun LoginScreen(onLogin: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var emailError by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val focus = LocalFocusManager.current

    if (loading) {
        LaunchedEffect(Unit) {
            delay(1000)
            loading = false
            onLogin()
        }
    }

    Page(title = "ログイン") {
        DotwearIcon(DotwearIcons.User, scale = 3)
        DotwearTextField(
            value = email,
            onValueChange = { email = it },
            label = "メールアドレス",
            placeholder = "メールアドレスを入力",
            error = emailError,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            modifier = Modifier.testTag("email"),
        )
        DotwearTextField(
            value = password,
            onValueChange = { password = it },
            label = "パスワード",
            placeholder = "8 文字以上",
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            visualTransformation = PasswordVisualTransformation(),
        )
        DotwearButton(
            onClick = {
                // デモなので、形式だけを確かめる。送信したらキーボードを閉じる
                focus.clearFocus()
                if ("@" !in email) {
                    emailError = "メールアドレスの形式が正しくありません"
                } else {
                    emailError = null
                    loading = true
                }
            },
            size = DotwearButtonSize.Large,
            loading = loading,
            enabled = !loading,
            modifier = Modifier.fillMaxWidth().testTag("login"),
        ) { Text("ログイン") }
    }
}

@Composable
fun OrderListScreen(orders: List<Order>, onOpen: (String) -> Unit, onSettings: () -> Unit) {
    var query by remember { mutableStateOf("") }
    val filtered = orders.filter { query.isEmpty() || query in it.customer || query in it.id }
    Page(
        title = "受注一覧",
        action = {
            DotwearButton(onClick = onSettings, variant = DotwearButtonVariant.Ghost, size = DotwearButtonSize.Small, modifier = Modifier.testTag("settings")) {
                DotwearIcon(DotwearIcons.Settings, contentDescription = "設定")
            }
        },
    ) {
        DotwearTextField(value = query, onValueChange = { query = it }, label = "検索", placeholder = "顧客名・番号で検索")
        for (order in filtered) {
            // 行全体を 1 つのボタンとして読み上げる。カード自体は見た目だけ（card.md）
            DotwearCard(
                Modifier
                    .fillMaxWidth()
                    .clickable(role = Role.Button, onClickLabel = "詳細を開く") { onOpen(order.id) }
                    .testTag("order-${order.id}"),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Dotwear.dots(6))) {
                    DotwearIcon(order.status.icon, scale = 2)
                    Column(Modifier.weight(1f)) {
                        Text(order.customer, fontWeight = FontWeight.Bold)
                        Text("${order.id}・${order.status.label}", style = MaterialTheme.typography.bodySmall)
                    }
                    Text(order.yen)
                }
            }
        }
    }
}

@Composable
fun OrderDetailScreen(order: Order, onChange: (Order) -> Unit, onDelete: () -> Unit, onBack: () -> Unit) {
    var confirmingDelete by remember { mutableStateOf(false) }
    Page(title = order.id, onBack = onBack) {
        DotwearCard(Modifier.fillMaxWidth()) {
            Text(order.customer, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.semantics { heading() })
            Text("金額：${order.yen}")
            Text("状態：${order.status.label}")
        }
        DotwearTextField(value = order.note, onValueChange = { onChange(order.copy(note = it)) }, label = "メモ", placeholder = "メモを入力")
        DotwearButton(
            onClick = { onChange(order.copy(status = Order.Status.Confirmed)) },
            enabled = order.status == Order.Status.Draft,
            size = DotwearButtonSize.Large,
            modifier = Modifier.fillMaxWidth(),
        ) {
            DotwearIcon(DotwearIcons.Check)
            Text("確定する")
        }
        DotwearButton(
            onClick = { confirmingDelete = true },
            variant = DotwearButtonVariant.Danger,
            size = DotwearButtonSize.Large,
            modifier = Modifier.fillMaxWidth().testTag("delete"),
        ) {
            DotwearIcon(DotwearIcons.Trash)
            Text("削除")
        }
    }
    // 確認のダイアログは Material 3 の標準のまま（色だけ DotwearTheme に合わせる）
    if (confirmingDelete) {
        AlertDialog(
            onDismissRequest = { confirmingDelete = false },
            title = { Text("この受注を削除しますか？") },
            confirmButton = { TextButton(onClick = onDelete) { Text("削除") } },
            dismissButton = { TextButton(onClick = { confirmingDelete = false }) { Text("キャンセル") } },
        )
    }
}

@Composable
fun SettingsScreen(onLogout: () -> Unit, onBack: () -> Unit) {
    var notifications by remember { mutableStateOf(true) }
    var sound by remember { mutableStateOf(false) }
    var weeklyReport by remember { mutableStateOf(true) }
    var agreeAnalytics by remember { mutableStateOf(false) }
    Page(title = "設定", onBack = onBack) {
        DotwearCard(Modifier.fillMaxWidth()) {
            Text("通知", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.semantics { heading() })
            DotwearSwitch(checked = notifications, onCheckedChange = { notifications = it }, modifier = Modifier.testTag("push"), label = { Text("プッシュ通知") })
            DotwearSwitch(checked = sound, onCheckedChange = { sound = it }, enabled = notifications, label = { Text("通知音") })
            DotwearCheckbox(checked = weeklyReport, onCheckedChange = { weeklyReport = it }, label = { Text("週次レポートをメールで受け取る") })
        }
        DotwearCard(Modifier.fillMaxWidth()) {
            Text("プライバシー", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.semantics { heading() })
            DotwearCheckbox(checked = agreeAnalytics, onCheckedChange = { agreeAnalytics = it }, label = { Text("利用状況の送信に同意する") })
        }
        Row(horizontalArrangement = Arrangement.spacedBy(Dotwear.dots(4))) {
            DotwearButton(onClick = onLogout, variant = DotwearButtonVariant.Secondary) { Text("ログアウト") }
            DotwearButton(onClick = onBack, variant = DotwearButtonVariant.Ghost) { Text("キャンセル") }
        }
    }
}
