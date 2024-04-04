# ステップ 1: ベースイメージとしてNode.jsを指定
FROM node:latest as builder

# 作業ディレクトリを設定
WORKDIR /app

# package.json と yarn.lock (または package-lock.json) をコピー
COPY package.json package-lock.json ./

# 依存関係をインストール
RUN npm install

# プロジェクトのソースコードをコピー
COPY . .

# .env ファイルをコンテナにコピー
COPY .env.local ./

# Next.jsアプリケーションをビルド
RUN npm run build

# ステップ 2: 実行用のイメージを作成
FROM node:alpine

# 作業ディレクトリを設定
WORKDIR /app

# builderステージからビルドされたファイルをコピー
COPY --from=builder /app/next.config.mjs ./next.config.js
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

# アプリケーションのポートを指定
EXPOSE 3001

# アプリケーションを実行
CMD ["npm", "start"]
