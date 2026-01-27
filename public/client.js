// アプリケーションのロジックを定義
const app = {
    isLoggedIn: false,
    isRegisterPage: false,
    message: '',
    user: { username: '', password: '' },
    items: [],
    searchTag: '',
    form: { id: null, name: '', count: 1, image: '', tagInput: '' },

    // 1. 初期化処理：ページを開いたときに保存されたユーザー名を確認
    async init() {
        const savedUser = localStorage.getItem("username");
        if (savedUser) {
            this.user.username = savedUser;
            this.isLoggedIn = true;
            this.fetchItems(); // 保存されていたら即座にデータを読み込む
            console.log("セッションを復元しました:", savedUser);
        }
    },

    // 2. ユーザー登録
    async register() {
        this.message = "登録中...";
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.user)
            });
            const data = await res.json();
            if (res.ok) {
                alert("登録が完了しました！ログインしてください。");
                this.isRegisterPage = false;
                this.message = "";
            } else {
                this.message = data.msg || "登録に失敗しました";
            }
        } catch (e) {
            this.message = "サーバーに接続できません";
        }
    },

    // 3. ログイン：成功時にlocalStorageへ保存
    async login() {
        console.log("Logging in:", this.user.username);
        this.message = "ログイン中...";
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.user)
            });
            const data = await res.json();
            if (res.ok) {
                this.isLoggedIn = true;
                this.message = "";
                // ブラウザにユーザー名を保存
                localStorage.setItem("username", this.user.username);
                this.fetchItems();
            } else {
                this.message = data.msg || "ログインに失敗しました";
            }
        } catch (e) {
            this.message = "サーバーに接続できません";
        }
    },

    // 4. ログアウト：保存情報を消去
    logout() {
        this.isLoggedIn = false;
        localStorage.removeItem("username"); // ブラウザから削除
        this.user = { username: '', password: '' };
        this.message = "";
    },

    // 5. アイテム取得：自分のデータだけをリクエスト
    async fetchItems() {
        const tag = this.searchTag.replace('#', '').trim();
        // 自分のユーザー名をサーバーに伝える
        const res = await fetch(`/api/items?user=${this.user.username}&tag=${tag}`);
        this.items = await res.json();
    },

    // 6. アイテム保存：ユーザー名をデータに含める
    async saveItem() {
        if (!this.form.name) return alert("名前を入力してください");

        const tags = this.form.tagInput
            .split(/[ 　,]/)
            .filter(t => t.startsWith('#'))
            .map(t => t.replace('#', ''));

        const payload = { 
            id: this.form.id,
            name: this.form.name,
            count: this.form.count,
            image: this.form.image,
            tags: tags,
            username: this.user.username // ★誰のアイテムかを追加
        };

        await fetch("/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        this.resetForm();
        this.fetchItems();
    },

    // --- 画像リサイズ ---
    uploadImage(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 200;
                const scale = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                this.form.image = resizedBase64;
                console.log("Resized image size:", Math.round(resizedBase64.length / 1024), "KB");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    },

    editItem(item) {
        this.form = { 
            ...item, 
            tagInput: item.tags.map(t => '#' + t).join(' ') 
        };
        window.scrollTo(0, 0);
    },

    async deleteItem(id) {
        if (!confirm("削除しますか？")) return;
        await fetch(`/api/items/${id}`, { method: "DELETE" });
        this.fetchItems();
    },

    resetForm() {
        this.form = { id: null, name: '', count: 1, image: '', tagInput: '' };
    }
};

// 手動でマウント
PetiteVue.createApp(app).mount("#app");