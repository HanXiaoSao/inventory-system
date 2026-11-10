// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // 注意这里：把 app_lib 改成 my_shop_lib
    my_shop_lib::run()
}