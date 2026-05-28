# NestJS キャッチアップ 前提知識

## このドキュメントの位置づけ

`docs/NESTJS_CATCHUP_TASKS.md` を始める **前** に身につけておくべきことをまとめたもの。

NestJS のキャッチアップ資料は「TypeScript が読めて、Web の仕組みも知っている人」を前提にしている。完全に未経験の状態で読み始めると、Task 1 の `brew install asdf` の時点で「そもそもターミナルって何？」となり、Task 6 の `@Controller` で「`@` ってなに？」となり、最終的に「全部わからない」で止まってしまう。

このドキュメントは「最低限ここまでやってから NestJS 研修に進むと、つまずきが激減する」というラインを示す。

### 進め方

- **完璧を目指さない。**「見たことがある」「なんとなくわかる」レベルで OK。NestJS 研修を進めながら戻ってきて学び直すのが現実的
- **手を動かす。** 読むだけだとほぼ身につかない。Progate やドットインストールのような写経系サービスを併用すること
- **わからない単語は都度ググる。** 各タスクに「調べるキーワード」を載せている

---

## Phase -3: コンピュータと開発環境の基礎

### Task A-1: ターミナル（コマンドライン）を触れるようにする

**なぜやるか:** NestJS の開発はほぼすべてターミナルで進む。`yarn start:dev` も `docker compose up` も `git commit` もターミナルから打つ。ここを避けて通る道はない。

**やらないと困ること:** Phase 0 の Task 1（`brew install asdf`）の時点で何をしているか想像できず、エラーが出ても読み解けない。

**身につけたいこと:**

- ターミナル（macOS なら標準の Terminal.app または iTerm2）を開ける
- `pwd` / `ls` / `cd` / `mkdir` / `rm` / `cat` を使えて、自分が今どのディレクトリにいるか把握できる
- **絶対パス** と **相対パス** の違いがわかる（`/Users/xxx/...` と `./src/...` の違い）
- ホームディレクトリ `~` の意味がわかる
- `Ctrl + C` でコマンドを中断できる
- 環境変数（`$PATH` など）が「コマンドを実行するときに OS が見る場所のリスト」だと理解している

**おすすめリソース:** ドットインストール「UNIXコマンド入門」、または「新しいLinuxの教科書」(書籍)

**調べるキーワード:** `ターミナル 使い方 mac`, `シェル コマンド 一覧`, `絶対パス 相対パス`, `環境変数 PATH`

---

### Task A-2: テキストエディタ（VS Code）をセットアップする

**なぜやるか:** コードを書くにはエディタが必要。VS Code は無料・拡張機能が豊富・NestJS 開発で事実上の標準。

**身につけたいこと:**

- VS Code をインストールし、フォルダを開いてファイルを編集できる
- 統合ターミナル（`` Ctrl + ` ``）を開いてコマンドを実行できる
- ファイル検索（`Cmd + P`）、全文検索（`Cmd + Shift + F`）を使える
- 拡張機能をインストールできる（最低限: `Prettier`, `ESLint`, `Prisma`）
- 保存時自動フォーマットの設定ができる

**調べるキーワード:** `VS Code 初心者 設定`, `VS Code 拡張機能 おすすめ TypeScript`, `Prettier 自動フォーマット`

---

### Task A-3: ファイルとディレクトリの仕組みを理解する

**なぜやるか:** プロジェクトは数十〜数百のファイルでできている。「どこに何があるか」を扱える前提知識がないと、コードを読むこと自体ができない。

**身につけたいこと:**

- ファイル拡張子（`.ts` `.json` `.md` など）の意味
- 隠しファイル（`.env` `.gitignore` のように `.` で始まるファイル）の存在
- 文字コード（UTF-8）と改行コード（LF / CRLF）の存在を知っている

**調べるキーワード:** `隠しファイル mac`, `文字コード UTF-8`, `改行コード LF CRLF`

---

### Task A-4: Homebrew（パッケージマネージャ）を理解する

**なぜやるか:** macOS で開発ツールを入れるときの標準。`brew install xxx` で何が起きているかを知らないと、トラブル時に手が出ない。

**身につけたいこと:**

- Homebrew が「Mac 用のソフトウェアインストーラ」であること
- `brew install` / `brew list` / `brew uninstall` の意味
- `brew` でインストールしたものがどこに置かれているか（`/opt/homebrew/...`）

**調べるキーワード:** `Homebrew とは`, `brew install 使い方`

---

### Task A-5: Git の基本操作を覚える

**なぜやるか:** チーム開発では Git なしには1ファイルも触れない。`nestjs-sample` を `git clone` するところから NestJS 研修が始まる。

**やらないと困ること:** 自分の作業を失う、他人のコードを上書きしてしまう、レビューが受けられない。

**身につけたいこと:**

- Git が「ファイルの変更履歴を管理する仕組み」であること
- `git clone` / `git status` / `git diff` / `git add` / `git commit` / `git push` / `git pull` の意味と使い方
- ブランチの概念（main ブランチ、feature ブランチ）
- GitHub 上で他人のコードを読める

**おすすめリソース:** サル先生のGit入門、Progate「Git」

**調べるキーワード:** `Git 入門`, `git clone 使い方`, `ブランチ とは`, `GitHub 使い方`

---

## Phase -2: プログラミングと JavaScript の基礎

### Task B-1: プログラミングの基本概念を理解する

**なぜやるか:** 「変数」「関数」「条件分岐」「ループ」を知らずにいきなり NestJS のコードを見ても、ただの記号の羅列にしか見えない。

**身につけたいこと:**

- **変数**: 値に名前をつけて使い回す仕組み
- **関数**: 処理をまとめて名前をつけ、何度も呼び出せるようにする仕組み
- **条件分岐 (`if` / `else`)**: 条件によって処理を変える
- **ループ (`for` / `while`)**: 同じ処理を繰り返す
- **戻り値と引数**: 関数に値を渡し、結果を返してもらう

**おすすめリソース:** Progate「JavaScript」コース I, II

**調べるキーワード:** `プログラミング 基本 変数`, `関数 引数 戻り値`, `if 文 使い方`

---

### Task B-2: データ構造（配列・オブジェクト）を理解する

**なぜやるか:** API は基本的に「オブジェクトの配列」をやり取りする。`[{ id: 1, title: '...' }, ...]` という形が読めないと、レスポンスもリクエストも組み立てられない。

**身につけたいこと:**

- **配列**: `[1, 2, 3]` のような順序つきリスト
- **オブジェクト**: `{ name: 'taro', age: 20 }` のような key-value のまとまり
- 配列の中にオブジェクトを入れたネスト構造（API レスポンスでよく見る形）
- `null` と `undefined` の違い（雰囲気でいい）

**調べるキーワード:** `JavaScript 配列 オブジェクト`, `null undefined 違い`

---

### Task B-3: モダン JavaScript (ES6+) の構文に慣れる

**なぜやるか:** NestJS のコードは ES6+ の構文で書かれている。`const` / アロー関数 / 分割代入 / スプレッド構文を知らないと、1行も読めない。

**やらないと困ること:** `const { id } = req.params` のような頻出パターンが何をしているのか永遠にわからない。

**身につけたいこと:**

- `var` / `let` / `const` の違い（実務では `const` 中心、変える必要があれば `let`）
- **アロー関数** `(a, b) => a + b`
- **テンプレートリテラル** `` `Hello, ${name}` ``
- **分割代入** `const { id, name } = user`
- **スプレッド構文** `{ ...obj, newKey: 'value' }`
- 配列メソッド `map` / `filter` / `find` / `reduce`（最低 `map` と `filter`）

**おすすめリソース:** MDN「JavaScript ガイド」、jsprimer (https://jsprimer.net/) ← 完全無料の良書

**調べるキーワード:** `ES6 構文`, `アロー関数`, `分割代入`, `スプレッド構文`, `配列 map filter`

---

### Task B-4: 非同期処理（Promise / async・await）を理解する

**なぜやるか:** **ここを飛ばすと NestJS 研修は絶対に進まない。** Repository も Usecase も Controller も、ほぼすべての関数が `async` で、戻り値が `Promise` で書かれている。

**やらないと困ること:**

- `findById()` を呼んだら「Promise オブジェクト」が返ってきて、中身が取り出せない
- なぜ `await` を付ける必要があるか永遠にわからない
- エラーハンドリング（`try / catch`）もできない

**身につけたいこと:**

- 「非同期処理」が何のために必要か（DB アクセスやネットワーク通信は時間がかかるから）
- Promise が「将来結果が返ってくる箱」であること
- `async` 関数の中で `await` を使って結果を取り出す書き方
- `try / catch` でエラーを捕まえる書き方

**おすすめリソース:** jsprimer「非同期処理」章

**調べるキーワード:** `JavaScript Promise 入門`, `async await わかりやすく`, `非同期処理 とは`

---

### Task B-5: モジュールシステム (`import` / `export`) を理解する

**なぜやるか:** NestJS のファイルはすべて `import` / `export` で他のファイルとつながっている。仕組みを知らないと、「このクラスはどこから来た？」が追えない。

**身につけたいこと:**

- ファイルから関数やクラスを外に公開する `export`
- 他ファイルから取り込む `import`
- デフォルトエクスポート (`export default`) と名前付きエクスポートの違い
- `node_modules/` に外部ライブラリが入っていること

**調べるキーワード:** `ES Modules import export`, `node_modules とは`

---

### Task B-6: Node.js と npm / yarn を理解する

**なぜやるか:** NestJS は Node.js の上で動く。`package.json` / `yarn install` / `yarn add` がわからないと、ライブラリの追加もコマンドの実行もできない。

**身につけたいこと:**

- Node.js が「ブラウザの外で JavaScript を動かす実行環境」であること
- `package.json` がプロジェクトの設定ファイルで「使っているライブラリのリスト」が書かれていること
- `dependencies` と `devDependencies` の違い
- `yarn install` / `yarn add <パッケージ名>` の意味
- `yarn run <スクリプト名>` で `package.json` の `scripts` を実行できること

**調べるキーワード:** `Node.js とは`, `package.json 役割`, `yarn npm 違い`, `dependencies devDependencies`

---

## Phase -1: TypeScript の基礎

### Task C-1: なぜ TypeScript を使うのかを理解する

**なぜやるか:** TypeScript の存在意義を知らないと、型を書くのが「ただの面倒な作業」にしか感じられず、雑な書き方をしてしまう。

**身につけたいこと:**

- JavaScript には型がなく、間違いに実行するまで気づけないこと
- TypeScript なら **書いた瞬間** にエディタが間違いを赤線で教えてくれること
- 大規模・チーム開発で TypeScript が事実上の標準になっている理由

**調べるキーワード:** `TypeScript なぜ`, `JavaScript TypeScript 違い`

---

### Task C-2: 基本の型を書けるようにする

**なぜやるか:** 型注釈が読めないと、関数のシグネチャも変数宣言も何が起きているか追えない。

**身につけたいこと:**

- プリミティブ型: `string` / `number` / `boolean`
- 配列型: `string[]` / `number[]`
- オブジェクト型: `{ id: number; name: string }`
- 関数の型: `(a: number, b: number) => number`
- `any` は **使ってはいけない型** であると知っている（ルール上禁止）

**調べるキーワード:** `TypeScript 型注釈`, `TypeScript 基本型`, `any 使うな`

---

### Task C-3: `interface` と `type` を使えるようにする

**なぜやるか:** NestJS では DTO / Model / Entity をすべて `interface` か `type` で定義する。これが読めないとデータの形が把握できない。

**身につけたいこと:**

- `interface User { id: number; name: string }` の書き方
- `type` でも同じことができること（細かい違いは後回しで OK）
- **ユニオン型** `'asc' | 'desc'`（このアプリでよく使う）
- **オプショナルプロパティ** `name?: string`

**調べるキーワード:** `TypeScript interface type 違い`, `ユニオン型`, `オプショナル ?`

---

### Task C-4: クラスとコンストラクタを使えるようにする

**なぜやるか:** NestJS の Controller / Usecase / Repository は **すべてクラス** で実装する。クラスを書けないと NestJS のコードは書けない。

**やらないと困ること:** Task 8（Usecase の導入）以降、何をしているか一切わからなくなる。

**身につけたいこと:**

- `class Foo { ... }` の書き方
- `constructor` で初期値を受け取る
- アクセス修飾子 `public` / `private` / `readonly`
- 継承 `class Bar extends Foo`
- TypeScript 特有の **コンストラクタ短縮構文**

  ```ts
  class TodoUsecase {
    constructor(private readonly repo: TodoRepository) {}
  }
  ```

  この `private readonly` がプロパティ宣言を兼ねていることを理解する。**NestJS 全体でこのパターンが使われる。**

**調べるキーワード:** `TypeScript クラス`, `アクセス修飾子`, `コンストラクタ パラメータプロパティ`

---

### Task C-5: ジェネリクスを「読める」状態にする

**なぜやるか:** `Promise<Todo>` / `Array<Todo>` / `Pick<Todo, 'id'>` のような `<T>` 付きの型が頻出する。自分で書けなくていいが、**読めないと型エラーの意味がわからない**。

**身につけたいこと:**

- `<T>` が「あとから決める型」のプレースホルダであること
- `Promise<Todo>` =「Todo を返す Promise」
- `Pick<Todo, 'id' | 'title'>` =「Todo の id と title だけを取り出した型」

**調べるキーワード:** `TypeScript ジェネリクス`, `Pick Omit Partial`

---

### Task C-6: デコレータの「見た目」に慣れる

**なぜやるか:** NestJS は **デコレータ駆動** のフレームワーク。`@Controller()` `@Get()` `@Injectable()` `@Body()` がコードのいたるところに出てくる。

**身につけたいこと（実装は書けなくて OK）:**

- `@xxx()` が関数呼び出しで、クラスやメソッドに「飾り」をつけていること
- デコレータがそのクラス・メソッドに何かしらの **メタ情報** を付与し、フレームワークがそれを読んで動いていること
- 「これは NestJS のおまじないで、書かないと動かない」くらいの理解で先に進んでよい

**調べるキーワード:** `TypeScript デコレータ`, `NestJS デコレータ 一覧`

---

### Task C-7: TypeScript を実際に動かしてみる

**なぜやるか:** 読むだけでは身につかない。1ファイルでいいので自分で型をつけて、わざと間違えて、エディタが赤線を出すのを体験する。

**身につけたいこと:**

- `ts-node` か TypeScript Playground (https://www.typescriptlang.org/play) で実行できる
- 型エラーが出る → 直す のサイクルを5回以上経験する

**おすすめリソース:** サバイバル TypeScript (https://typescriptbook.jp/) ← 日本語の決定版・無料

**調べるキーワード:** `TypeScript Playground`, `ts-node 使い方`

---

## Phase 0 直前: Web と DB の基礎

### Task D-1: クライアント / サーバの関係を理解する

**なぜやるか:** NestJS は **サーバ側** のフレームワーク。クライアント（ブラウザやアプリ）が何で、サーバが何を返すのかをイメージできないと、何のために API を作っているのか腹落ちしない。

**身につけたいこと:**

- ブラウザ（クライアント）→ アプリサーバ → DB という3層の流れ
- リクエストとレスポンスがペアになっていること
- 1リクエスト = 1レスポンスの基本

**調べるキーワード:** `クライアントサーバ 仕組み`, `Web アプリケーション 3層`

---

### Task D-2: HTTP の基本を理解する

**なぜやるか:** REST API の動作はすべて HTTP の上に乗っている。メソッドとステータスコードを知らないと、Controller を書く意味がわからない。

**やらないと困ること:** Task 12 で「GET と POST と PATCH の使い分け」も「204 を返す理由」もわからない。

**身につけたいこと:**

- **HTTP メソッド**: `GET` / `POST` / `PATCH` / `PUT` / `DELETE` の意味と用途
- **ステータスコード**: `200 OK`, `201 Created`, `204 No Content`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`
- **リクエストの構成**: URL / メソッド / ヘッダ / ボディ
- **JSON** の書き方と「文字列」であること

**調べるキーワード:** `HTTP メソッド 一覧`, `HTTP ステータスコード 一覧`, `JSON とは`

---

### Task D-3: REST API の考え方を理解する

**なぜやるか:** このアプリの API はすべて REST 風に設計されている。「リソースを URL で表し、メソッドで操作を表す」というパターンを知らないと、API 設計の意図が読めない。

**身につけたいこと:**

- `/todos` = Todo の一覧、`/todos/:id` = 特定の Todo というリソース指向の URL 設計
- 一覧取得 = `GET /todos`、作成 = `POST /todos`、更新 = `PATCH /todos/:id`、削除 = `DELETE /todos/:id` という対応

**調べるキーワード:** `REST API とは`, `RESTful 設計`, `リソース指向 URL`

---

### Task D-4: curl と DevTools で API を叩けるようにする

**なぜやるか:** 自分が作った API が動いているか確認する手段。Postman を使ってもいいが、curl は CI でも使うので慣れておいて損はない。

**身につけたいこと:**

- `curl http://localhost:3000/todos` で GET ができる
- `curl -X POST -H 'Content-Type: application/json' -d '{"title":"..."}' http://localhost:3000/todos` で POST ができる
- ブラウザの DevTools (`F12`) の **Network タブ** でリクエスト / レスポンスを確認できる

**調べるキーワード:** `curl 使い方`, `curl POST JSON`, `Chrome DevTools Network タブ`

---

### Task D-5: リレーショナル DB の基本を理解する

**なぜやるか:** Prisma は「リレーショナル DB を TypeScript から触る」道具。元になる DB の概念がないと、Prisma スキーマ（Task 9）が何のためのものか理解できない。

**身につけたいこと:**

- **テーブル / レコード / カラム** の関係
- **主キー (Primary Key)** と **外部キー (Foreign Key)**
- **1対多 / 多対多** のリレーション（Task 22 の Todo ↔ Tag で出てくる）
- 簡単な SQL を **眺めて意味がわかる** 程度

  ```sql
  SELECT * FROM todos WHERE completed = false;
  INSERT INTO todos (title) VALUES ('買い物');
  ```

- ORM が「SQL を直接書かずに DB を操作する仕組み」であること

**おすすめリソース:** Progate「SQL」コース I

**調べるキーワード:** `リレーショナルデータベース 入門`, `主キー 外部キー`, `SQL 基本`, `ORM とは`

---

### Task D-6: Docker を「使う」側として理解する

**なぜやるか:** Phase 0 の Task 3 で MySQL を Docker で立ち上げる。中身を作れなくてもいいが、`docker compose up` で何が起きているかは理解しておく。

**身につけたいこと:**

- Docker が「アプリを動かすための環境ごと配布する仕組み」であること
- コンテナとイメージの違い（雰囲気で OK）
- `docker compose up -d` / `docker compose down` / `docker compose ps` / `docker compose logs` の意味
- ポートマッピング (`3306:3306`) が「コンテナ内のポートを Mac 側に開ける」設定であること

**調べるキーワード:** `Docker とは 初心者`, `Docker Compose 入門`, `ポートマッピング`

---

## ここまで終わったら

`docs/NESTJS_CATCHUP_TASKS.md` の **Phase 0: 環境構築** に進む。

研修を進めながら詰まったら、このドキュメントに戻って該当 Task をやり直す前提で OK。最初から全部マスターしようとしないこと。

### 目安の所要時間

完全未経験から始める場合、**腰を据えて取り組んで合計 2〜4 週間** が現実的なライン。

| Phase | 内容 | 目安 |
|-------|------|------|
| Phase -3 | コンピュータ・開発環境 | 2〜3日 |
| Phase -2 | プログラミング・JavaScript | 1〜2週間 |
| Phase -1 | TypeScript | 4〜7日 |
| Phase 0 直前 | Web / DB | 3〜5日 |

「読んでわかったつもり」では確実に NestJS 研修で詰まる。**実際にコードを書いた量** が理解度を決める。

---

## 進め方のコツ

1. **写経でいいので手を動かす** — Progate でもドットインストールでも、画面を見るだけで終わらせない
2. **わからない単語を放置しない** — 「調べるキーワード」で都度ググる癖をつける
3. **エラーメッセージを読む** — 英語でも臆さず、まずは読む。読めば9割は何が悪いか書いてある
4. **質問する力をつける** — ChatGPT / Claude に「○○がわからない、サンプルコードで教えて」と聞けるようになる
5. **完璧主義にならない** — Phase -2 までで何となく動くようになったら、一度 NestJS 研修に進んで、詰まったら戻ってくる
