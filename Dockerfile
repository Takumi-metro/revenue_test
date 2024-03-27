# ベースイメージの指定
FROM python:3.8

# 作業ディレクトリの設定
WORKDIR /app

# 依存関係ファイルをコピー
COPY requirements.txt ./

# 依存関係のインストール
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションの実行
CMD ["python", "./your-app.py"]