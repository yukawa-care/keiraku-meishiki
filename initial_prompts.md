# Claude Code 初期プロンプト集 ― 経絡命式プロジェクト

このファイルは Claude Code に**順番に貼り付けて使う**プロンプト集です。各プロンプトは独立して動作するよう書かれていますが、原則として上から順に実行してください。

各プロンプトの先頭で `CLAUDE.md` を参照することを明示しているので、Claude Code はプロジェクト全体のコンテキストを把握した上で作業します。

---

## 【前提】Claude Code 初期セットアップ

ターミナルで一度だけ実行:

```bash
# Node.js 20以上が必要
node --version

# Claude Code インストール（未導入の場合）
npm install -g @anthropic-ai/claude-code

# プロジェクトディレクトリ作成
mkdir keiraku-meishiki && cd keiraku-meishiki

# CLAUDE.md をこのフォルダに配置（既に作成済みのファイルをコピー）

# Claude Code 起動
claude
```

---

## Week 1: 基盤構築

### Prompt 1-1: プロジェクト初期化

```
CLAUDE.md を読んで、このプロジェクトの方針を完全に理解してください。

その上で、Next.js 15 + TypeScript（strict mode）+ Tailwind CSS 4 + 
shadcn/ui の構成でプロジェクトを初期化してください。

要件:
- App Router 使用
- ESLint + Prettier 設定
- Vitest を導入（計算エンジン用に網羅率100%目標）
- CLAUDE.md に記載のディレクトリ構造を作成
- .env.example を用意し、必要な環境変数を列挙
- README.md を作成（プロジェクト概要・セットアップ手順・コマンド一覧）

実装後、`npm run dev` で起動できる状態にしてください。
```

### Prompt 1-2: 認証・DB セットアップ

```
CLAUDE.md を参照しつつ、認証と DB の基盤を構築してください。

1. Clerk を導入し、サインアップ・ログイン・ログアウトを実装
2. Supabase プロジェクトと接続（接続情報は .env.local に記載される前提）
3. Drizzle ORM を設定し、以下のスキーマを作成:

users テーブル（Clerk と連携、user_id を主キーに）
  - clerk_user_id (PK)
  - email
  - display_name
  - created_at, updated_at

birth_profiles テーブル（鑑定対象者の生年月日情報、暗号化）
  - id (uuid, PK)
  - user_id (FK)
  - profile_name (本人/家族/友人など複数登録可)
  - birth_date_encrypted (text)
  - birth_time_encrypted (text)
  - birth_location_encrypted (text)
  - timezone (varchar)
  - created_at, updated_at, deleted_at (soft delete)

readings テーブル（鑑定履歴）
  - id (uuid, PK)
  - user_id (FK)
  - birth_profile_id (FK)
  - reading_type (enum: shichu, ziwei, sanmei, ekkyo)
  - calc_result (jsonb) -- Layer 1 の決定論的結果
  - interpretation_blocks (jsonb) -- Layer 2 から引いたブロック
  - synthesized_text (text) -- Layer 3 の生成結果
  - created_at

subscriptions テーブル（Stripe 連携）
  - id (uuid, PK)
  - user_id (FK)
  - stripe_customer_id
  - stripe_subscription_id
  - status (active, canceled, past_due 等)
  - plan_id
  - current_period_end
  - created_at, updated_at

暗号化は AES-256-GCM、key は環境変数 ENCRYPTION_KEY から取得。
src/lib/crypto.ts に encrypt/decrypt 関数を実装してください。

マイグレーションスクリプトも生成してください。
```

### Prompt 1-3: 干支・節気計算基盤

```
CLAUDE.md の Layer 1 設計に従い、四柱推命・算命学共通の暦学計算基盤を実装してください。

src/engines/shared/ に以下を実装:

1. solar-term.ts: 二十四節気の節入り時刻計算
   - astronomy-engine を使い、太陽黄経から各節気の正確な時刻を算出
   - 精度: 誤差1分未満
   - 関数: getSolarTermDateTime(year: number, term: SolarTerm): Date

2. kanshi.ts: 60干支のロジック
   - 関数: getDayPillar(date: Date): { stem: string, branch: string }
   - 関数: getYearPillar / getMonthPillar / getHourPillar
   - 関数: getKanshiIndex(stem, branch): number (0-59)
   - 月柱は節入りを境に変わることを正確に反映

3. longitude-correction.ts: 出生地の経度補正
   - 日本標準時（明石市東経135度）基準で出生地の経度から時刻補正
   - 関数: applyLongitudeCorrection(localDate: Date, longitudeDeg: number): Date

各関数に対し、以下の検証ケースで通る単体テストを書いてください:
- 1987年6月10日 1:00 兵庫県明石市生まれ（zired.net のサンプル）
- 2000年1月1日 0:00 東京（経度 139.69）
- 節入り直前・直後の日付（2024年2月3日23時 vs 2024年2月4日5時 = 立春前後）

典拠コメント（書名・ページ）を必ず関数の上に記載してください。
```

---

## Week 2: 計算エンジン

### Prompt 2-1: 四柱推命エンジン

```
CLAUDE.md と src/engines/shared/ の基盤を使い、四柱推命エンジンを実装してください。

src/engines/shichu/ に以下を実装:

1. types.ts: 命式の型定義
   - Pillar { stem, branch, hiddenStems[] }
   - Meishiki { year, month, day, hour, gender, dailyMaster }
   - TenStar (通変星10種)
   - TwelveFortune (十二運12種)

2. calculator.ts: メイン計算関数
   - calculateMeishiki(birthInfo: BirthInfo): Meishiki
   - 蔵干（地支の中の天干）を正確に算出
   - 通変星を日干基準で算出
   - 十二運を日干基準で算出

3. daiun.ts: 大運（10年運）算出
   - 男女・陰陽干別の順行・逆行ルール
   - 大運の起算年齢（端数日数 ÷ 3 = 年）
   - calculateDaiun(meishiki): DaiunEntry[]

4. balance.ts: 五行バランス算出
   - 命式中の五行（木火土金水）の旺相休囚死を算出
   - getFiveElementsBalance(meishiki): FiveElementsBalance

検証ケース（テストで通すこと）:
- 1987年6月10日 1:00 明石市男性 → 三柱推命の標準的なサンプルと一致
- 既存の信頼性の高い無料サイト（zired.net、八字仙人）と最低2件突合

すべての判定ロジックに典拠コメント（小山内彰『四柱推命の本』等）を残してください。
```

### Prompt 2-2: 紫微斗数エンジン（iztro ラッパー）

```
紫微斗数は iztro ライブラリ（https://github.com/SylarLong/iztro）を活用します。

src/engines/ziwei/ に以下を実装:

1. iztro を npm install して、TypeScript で型安全に扱えるラッパーを作成
2. types.ts: 我々のドメイン型に変換
   - ZiweiChart { palaces[12], mainStars, fourTransformations }
   - Palace { name, branch, stars[], brightness }

3. calculator.ts:
   - calculateZiweiChart(birthInfo): ZiweiChart
   - iztro の出力を我々の型に変換
   - 日本語ラベル統一（iztro は中国語デフォルト、ja-JP に切替）

4. selectors.ts: 命盤から「重要な構造」を抽出
   - 命宮の主星
   - 三方四正（命宮・遷移宮・財帛宮・官禄宮）の組み合わせ
   - 四化の流れ
   - これが Layer 2 の検索キーになる

検証: iztro 公式サンプル（2000-8-16 2時生まれ男性）の出力と完全一致すること。
```

### Prompt 2-3: 算命学・易経エンジン

```
残り2占術を実装します。

src/engines/sanmei/ （算命学）:
1. 陰占（年月日の干支） ← shichu の流用可
2. 陽占（人体星図、5つの主星）
   - 頭・左手・胸・右手・腹 の5箇所への星配置
   - 干合・支合・三合・冲・刑・害の組合せ判定
3. 宿命中殺（天中殺）の算出
4. 流派: 高尾系を採用する旨をコードコメントに明記

src/engines/ekkyo/ （易経）:
1. 64卦のマスターデータ（卦名・卦辞・象辞・各爻辞）
   - data/canonical/ekkyo-hexagrams.json に格納
   - 周易ベース
2. 3コイン法シミュレーション
   - drawHexagram(): { primary: Hexagram, changing: Hexagram | null, changingLines: number[] }
3. 筮竹法シミュレーション（オプション）

検証:
- 算命学: 既存の算命学サイトと干合・支合の判定が一致
- 易経: 64卦の名前と卦辞が周易原典と一致（『易経』岩波文庫版を典拠とする）
```

---

## Week 3: 解釈レイヤー

### Prompt 3-1: 正典 DB のスキーマと取込

```
CLAUDE.md の Layer 2 設計に基づき、解釈ナレッジベースを構築します。

1. data/canonical/ に以下のディレクトリ構造を作成:
   - shichu/
     - day-stem_ten-star/  # 日柱十干 × 通変星
     - five-elements-balance/  # 五行バランス
     - meridian-mapping/   # 経絡対応（差別化の核）
   - ziwei/
   - sanmei/
   - ekkyo/

2. 別途配布される keiraku_canonical_template.xlsx を読み取り、
   各シートを JSON ファイルに変換するスクリプトを作成:
   scripts/import-canonical.ts

3. JSON のスキーマ:
   {
     "id": "shichu.day-stem-ki.kankan",
     "category": "day-stem_ten-star",
     "keys": { "dayStem": "甲", "tenStar": "比肩" },
     "title": "甲日生まれの比肩",
     "core_meaning": "...",
     "personality": "...",
     "career": "...",
     "relationship": "...",
     "health_meridian": "...",  # ここが差別化部分
     "caveats": "...",
     "source": "湯川研一監修（2026年5月）"
   }

4. DB に取り込む repository クラス:
   src/interpretation/repositories/canonical-repository.ts
   - findByKeys(category, keys): InterpretationBlock | null
   - findMultiple(queries): InterpretationBlock[]

5. 起動時にバリデーションする CLI:
   npm run validate:canonical
   - 必須フィールドの欠落をチェック
   - 「治る」「治療」等の禁止語をチェック
```

### Prompt 3-2: セレクタロジック

```
命式データから「どの解釈ブロックを引くべきか」を決めるロジックを実装します。

src/interpretation/selectors/ に:

1. shichu-selector.ts:
   selectBlocksForShichu(meishiki: Meishiki): InterpretationBlock[]
   
   選択ルール:
   - 日柱十干 × 命式中の主要な通変星 上位3個（最大3ブロック）
   - 五行バランスの最も旺ずる五行 → 該当の経絡ブロック1個
   - 月柱の節気 → 季節養生ブロック1個
   - 合計 5〜7 ブロックを返す

2. ziwei-selector.ts:
   命宮主星 + 三方四正の組合せから選択

3. sanmei-selector.ts:
   日干 + 陽占5星 + 天中殺の組合せから選択

4. ekkyo-selector.ts:
   本卦 + 変卦 + 変爻 から該当する爻辞ブロックを選択

各セレクタに単体テストを書いてください。
```

### Prompt 3-3: Claude API 統合（Layer 3）

```
CLAUDE.md の Layer 3 規約に厳格に従い、Claude API 統合層を実装します。

src/synthesis/ に:

1. client.ts: Anthropic SDK ラッパー
   - @anthropic-ai/sdk を使用
   - モデル: claude-sonnet-4-6-20251001
   - max_tokens: 4000
   - temperature: 0.4（創造性を抑制）

2. prompts/shichu-synthesis.ts:
   システムプロンプトは CLAUDE.md の「Layer 3 のシステムプロンプトテンプレ」を厳守。
   ブロック群とユーザー情報を構造化して渡す。

3. orchestrator.ts: メインフロー
   generateReading(userId, profileId, readingType): Promise<Reading>
   
   フロー:
   a) BirthProfile を取得（復号）
   b) Layer 1 で命式を計算
   c) Layer 2 から該当ブロックを選択
   d) Layer 3 で整文
   e) DB に保存
   f) Reading オブジェクトを返す

4. validators.ts: 生成文の事後検証
   - 「治る」「治療」「効く」「診断」「必ず」「絶対」等の禁止語をチェック
   - 禁止語があれば再生成（最大3回）、それでも残れば人間レビュー待ちフラグ

5. 単体テストとモック:
   実際の API を呼ばずに動作テストできるよう Anthropic SDK をモック化。
```

---

## Week 4: UI・課金・LP

### Prompt 4-1: 鑑定 UI

```
ユーザーが鑑定を実行・閲覧できる UI を実装します。

1. /reading/new ページ:
   - 鑑定タイプ選択（四柱推命・紫微斗数・算命学・易経）
   - 既存 BirthProfile を選択 or 新規入力
   - 生年月日・時刻・出生地の入力フォーム
   - 「鑑定を生成」ボタン

2. 鑑定生成中のローディング UI:
   - 「計算しています...」「ナレッジベースを参照しています...」「鑑定文を整えています...」
   - Layer 1/2/3 のフェーズに応じて表示更新（Server Actions + Streaming で）

3. /reading/[id] ページ:
   - 命式図/命盤図の可視化（SVG）
   - 鑑定文の表示（章立て付き）
   - PDF ダウンロードボタン（後実装でOK、まずは UI のみ）
   - 「経絡的養生」セクションを明確に区別して表示

4. shadcn/ui を活用し、湯川先生のブランドに合う和モダンなトーン:
   - フォント: Noto Serif JP
   - アクセント色: 深い藍（#1a3a5c）と金（#c8a951）
   - 余白を多く取り、医院サイトの上品さを継承
```

### Prompt 4-2: Stripe 課金統合

```
商用展開のため Stripe による課金を実装します。

1. Stripe ダッシュボードで作成済みの料金プラン:
   - 単発鑑定（四柱推命）: 3,000円
   - 単発鑑定（紫微斗数・算命学・易経）: それぞれ 5,000円
   - スタンダードプラン（月額）: 1,980円 — 月3回鑑定 + 日々の運勢
   - プレミアムプラン（月額）: 4,980円 — 鑑定無制限 + 経絡養生レポート月次配信

2. /pricing ページ実装

3. Stripe Checkout 統合:
   - 単発購入: app/api/checkout/single/route.ts
   - サブスク登録: app/api/checkout/subscription/route.ts

4. Stripe Webhook:
   - app/api/webhooks/stripe/route.ts
   - checkout.session.completed → readings 単発権限付与 or subscriptions 作成
   - customer.subscription.updated/deleted → subscriptions テーブル同期
   - invoice.payment_failed → ユーザー通知

5. 権限チェックミドルウェア:
   - 単発購入者: 該当鑑定タイプを1回実行可能
   - スタンダード: 月3回までカウント
   - プレミアム: 無制限

決済テストは Stripe テストカード（4242 4242 4242 4242）で完結すること。
```

### Prompt 4-3: ランディングページ

```
クローズドβ向けのランディングページを実装します。

/  （ルート）に LP を配置。

構成:
1. ヒーローセクション
   - キャッチコピー: 「あなたの命式を、経絡で読み解く。」
   - サブコピー: 「32年の臨床経験を持つ鍼灸師が監修。占術と東洋医学を融合した、唯一の鑑定。」
   - CTA: 「無料で命式を見る」ボタン
   - 背景: 和モダンな抽象的な水墨イラスト（SVGで生成 or プレースホルダー）

2. 「なぜ経絡命式か」セクション
   - 既存の占いとの違い（健康に翻訳できる占い）
   - 監修者プロフィール（湯川研一、鍼灸師、32年）

3. 4つの占術紹介セクション
   - 四柱推命・紫微斗数・算命学・易経のカード

4. 経絡 × 五行 の説明セクション（核となる差別化）
   - 五行 → 五臓 → 経絡 の図解
   - 「水が旺ずる命式の方は、腎経・膀胱経のケアが鍵」のような具体例

5. 料金プラン（/pricing への導線）

6. FAQ
   - 「占いは当たりますか？」 → 統計的な傾向です、運命論ではありません
   - 「医療行為ですか？」 → いいえ、健康面はあくまで養生のヒントです
   - 「個人情報は安全ですか？」 → AES-256 暗号化、退会時24時間以内に完全削除

7. フッター: 特商法表記・プライバシーポリシー・利用規約 リンク

8. SEO:
   - title: 「経絡命式 | 鍼灸師監修・東洋医学と占術の鑑定」
   - meta description: 150字以内、適切にキーワード配置
   - Article schema（湯川研一を Person として記述）
   - 構造化データを正しく実装
```

### Prompt 4-4: 法務ページ

```
特商法・プライバシーポリシー・利用規約の3点を実装します。

/legal/commerce — 特定商取引法に基づく表記
/legal/privacy — プライバシーポリシー
/legal/terms — 利用規約

それぞれ MDX で書き、湯川先生が後で文言調整しやすい構造にしてください。

特商法表記の必須項目（漏らさない）:
- 販売事業者名（個人事業の場合は代表者名）
- 所在地（治療院住所）
- 電話番号・メールアドレス
- 販売価格
- 支払方法・支払時期
- 商品引渡時期
- 返品・キャンセル
- 動作環境

プライバシーポリシーの必須項目:
- 取得する個人情報の項目
- 利用目的
- 第三者提供の有無
- 暗号化・保管方法
- 開示・訂正・削除請求の手順
- 問い合わせ先

利用規約の必須項目:
- サービス内容
- アカウント管理
- 禁止事項
- 免責事項（「鑑定結果は参考情報であり、断定的判断ではない」「医療行為ではない」を明記）
- サービス変更・停止
- 準拠法・管轄

法律的に踏み外せない箇所はテンプレを使い、フォームで文章を埋める設計でも可。
```

---

## Phase 2 以降（後日着手）

- Prompt 5-1: メール配信（クローズドβ招待、月次運勢配信）
- Prompt 5-2: PDF 出力（WeasyPrint で鑑定書を整形 PDF 化）
- Prompt 5-3: 経絡養生レポート月次自動生成（プレミアムプラン特典）
- Prompt 5-4: GBP / SNS 連携（既存の yukawa-care.net への送客）
- Prompt 6-1: 患者カルテとの連携（クリニック内 PoC、要 ITヘルプデスク的設計）

---

## 使い方のコツ

1. **CLAUDE.md を常に参照させる**: 新しいタスクのプロンプト冒頭に「CLAUDE.md を読んでから」と明示
2. **テスト先行**: 「単体テストを先に書いて、それを通すコードを書いて」と指示すると品質が上がる
3. **典拠コメント必須**: 「典拠コメント（書名・ページ）を必ず残して」と毎回指示
4. **長いタスクは分割**: 1プロンプト = 1機能。混ぜると Claude Code の質が下がる
5. **PR レビューモード**: 完成後「このコードに対し、ベテランのエンジニアとしてレビューコメントを書いて」で品質チェック
