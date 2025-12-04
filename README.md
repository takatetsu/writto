# Writto

[English](#english) | [日本語](#japanese)

---

<a name="english"></a>
## English

A Typora-like Markdown editor built with Tauri, React, and TypeScript.

### Features

- **Inline Rendering**: Hides Markdown syntax when not editing, displaying a preview-like view
- **File Operations**: New, Open, Save, Save As
- **Sidebar**: File tree and outline view
- **Search & Replace**: Regex-supported search functionality
- **Export**: HTML export
- **Print**: Print and save as PDF
- **Settings**: Customizable font size and font family
- **Table Support**: GFM-compliant table rendering with alignment support
- **Line Numbers**: Toggle line numbers display
- **Word Wrap**: Toggle word wrap

### Prerequisites

To run this project, you need:

- **Node.js**: For frontend dependency management and build
- **Rust**: For building the Tauri backend
  - [Install Rust](https://www.rust-lang.org/tools/install)

### Setup and Run

1. **Install Dependencies**

   Run the following command in the project root directory to install required packages:

   ```bash
   npm install
   ```

2. **Run in Development Mode**

   Run the following command to start the application in development mode with hot reload enabled:

   ```bash
   npm run tauri dev
   ```

   The first run may take some time to compile Rust dependencies.

3. **Production Build**

   To build the application for distribution, run:

   ```bash
   npm run tauri build
   ```

   The built installer and executable will be output to the `src-tauri/target/release/bundle` directory.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<a name="japanese"></a>
## 日本語

Tauri、React、TypeScript で構築された、Typora ライクな Markdown エディタです。

### 機能

- **インラインレンダリング**: 編集していない Markdown 記法を隠し、プレビューのように表示します
- **ファイル操作**: 新規作成、開く、保存、名前を付けて保存
- **サイドバー**: ファイルツリーとアウトライン表示
- **検索と置換**: 正規表現対応の検索機能
- **エクスポート**: HTML 形式でのエクスポート
- **印刷**: 印刷および PDF 保存
- **設定**: フォントサイズとフォントファミリーの変更
- **テーブルサポート**: GFM準拠のテーブルレンダリング（配置対応）
- **行番号**: 行番号の表示切り替え
- **ワードラップ**: ワードラップの切り替え

### 前提条件

このプロジェクトを実行するには、以下の環境が必要です。

- **Node.js**: フロントエンドの依存関係管理とビルドに使用します
- **Rust**: Tauri バックエンドのビルドに使用します
  - [Rust のインストール方法](https://www.rust-lang.org/tools/install)

### セットアップと実行

1. **依存関係のインストール**

   プロジェクトのルートディレクトリで以下のコマンドを実行し、必要なパッケージをインストールします。

   ```bash
   npm install
   ```

2. **開発モードで実行**

   以下のコマンドを実行すると、アプリケーションが開発モードで起動します。ホットリロードが有効になっています。

   ```bash
   npm run tauri dev
   ```

   初回起動時は Rust の依存関係のコンパイルに時間がかかる場合があります。

3. **プロダクションビルド**

   配布用のアプリケーションをビルドするには、以下のコマンドを実行します。

   ```bash
   npm run tauri build
   ```

   ビルドされたインストーラーや実行ファイルは `src-tauri/target/release/bundle` ディレクトリに出力されます。

### ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。
