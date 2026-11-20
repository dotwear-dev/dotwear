package com.example.dotwear.demo

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import dev.dotwear.compose.Dotwear
import dev.dotwear.compose.DotwearTheme

/** 画面の切り替え。デモなので Navigation ライブラリを使わず、状態で切り替える */
sealed interface Screen {
    data object Login : Screen
    data object List : Screen
    data class Detail(val id: String) : Screen
    data object Settings : Screen
}

@Composable
fun DemoApp(startLoggedIn: Boolean = false) {
    // アプリのルートに付ければ、全体に Dotwear のテーマが効く
    DotwearTheme {
        val orders = remember { mutableStateListOf(*Order.samples.toTypedArray()) }
        var stack by remember { mutableStateOf(listOf(if (startLoggedIn) Screen.List else Screen.Login)) }
        val push = { s: Screen -> stack = stack + s }
        val pop = { stack = stack.dropLast(1) }
        BackHandler(enabled = stack.size > 1) { pop() }

        Box(Modifier.fillMaxSize().background(Dotwear.colors.background).safeDrawingPadding()) {
            when (val screen = stack.last()) {
                Screen.Login -> LoginScreen(onLogin = { stack = listOf(Screen.List) })
                Screen.List -> OrderListScreen(orders, onOpen = { push(Screen.Detail(it)) }, onSettings = { push(Screen.Settings) })
                is Screen.Detail -> {
                    val index = orders.indexOfFirst { it.id == screen.id }
                    OrderDetailScreen(
                        order = orders[index],
                        onChange = { orders[index] = it },
                        onDelete = { orders.removeAt(index); pop() },
                        onBack = pop,
                    )
                }
                Screen.Settings -> SettingsScreen(onLogout = { stack = listOf(Screen.Login) }, onBack = pop)
            }
        }
    }
}
