// Dotwear のデモアプリ。「業務アプリをピクセル調にする」使い方の見本。
// UI は Dotwear の部品（中身は標準の clickable / toggleable / BasicTextField）で作る
package com.example.dotwear.demo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { DemoApp() }
    }
}
