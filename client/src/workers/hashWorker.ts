// client/src/workers/hashWorker.ts

// Workerがメインスレッドからメッセージを受け取った時の処理
self.onmessage = async (event: MessageEvent<File>) => {
    try {
        const file = event.data;

        // ファイルをArrayBufferとして読み込む
        const arrayBuffer = await file.arrayBuffer();

        // Web Crypto APIを使ってSHA-256ハッシュを計算（ここが重い処理）
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

        // バッファを16進数の文字列に変換
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // 計算成功：メインスレッドに結果を返す
        self.postMessage({ success: true, hash: hashHex });

    } catch (error: any) {
        // エラー発生：メインスレッドにエラーを返す
        self.postMessage({ success: false, error: error.message });
    }
};